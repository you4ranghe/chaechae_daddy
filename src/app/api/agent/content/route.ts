import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase-server";
import {
  generateContent,
  generateContentStream,
} from "@/lib/agents/content-planner";
import { checkUsageLimit, recordUsage } from "@/lib/db/usage";
import { fetchPerformanceContext, performanceContextToPrompt } from "@/lib/db/feedback";
import { buildPersonaContext, type ChildInfo } from "@/lib/persona/child-context";
import type {
  SponsorshipAnalysis,
  ChecklistItem,
} from "@/lib/types/sponsorship";

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 사용량 제한 체크
    const usage = await checkUsageLimit(supabase, user.id);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: usage.message,
          remaining: 0,
          plan: usage.plan,
          limit: usage.limit,
        },
        { status: 429 }
      );
    }

    // 3. 입력 검증
    const body = await request.json();
    const {
      sponsorshipId,
      analysis,
      checklist,
      stream: useStream,
    } = body as {
      sponsorshipId: string | null;
      analysis: SponsorshipAnalysis;
      checklist: ChecklistItem[];
      stream?: boolean;
    };

    if (!analysis || !checklist) {
      return NextResponse.json(
        { error: "분석 데이터와 체크리스트가 필요합니다." },
        { status: 400 }
      );
    }

    // profiles 테이블에서 컨텍스트 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("instagram_handle, categories, child_info, persona_bio")
      .eq("id", user.id)
      .single();

    // 과거 포스팅 성과 피드백 컨텍스트 (3건 이상 있을 때만)
    const perfCtx = await fetchPerformanceContext(supabase, user.id);
    const performanceContext = perfCtx ? performanceContextToPrompt(perfCtx) : undefined;

    const personaContext = buildPersonaContext({
      child: (profile?.child_info as ChildInfo | null) || null,
      personaBio: (profile?.persona_bio as string | null) || null,
    });

    const userContext = {
      instagramHandle: profile?.instagram_handle || user.user_metadata?.instagram_handle || "",
      categories: profile?.categories || user.user_metadata?.categories || [],
      performanceContext,
      personaContext,
    };

    // 4. 스트리밍 모드
    if (useStream) {
      const { stream, model } = generateContentStream(
        analysis,
        checklist,
        userContext
      );

      // 스트리밍 완료 후 DB 저장을 위해 별도 처리
      // (클라이언트에서 done 이벤트 받은 후 별도 PATCH 호출하거나,
      //  여기서 스트림을 래핑하여 완료 시 저장)
      const wrappedStream = wrapStreamWithSave(
        stream,
        supabase,
        user.id,
        sponsorshipId,
        model,
        usage.remaining
      );

      return new Response(wrappedStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // 5. 일반 모드 (비스트리밍)
    const { content, tokensUsed, model } = await generateContent(
      analysis,
      checklist,
      userContext
    );

    // 6. generated_contents 테이블에 저장
    if (sponsorshipId) {
      // 기존 버전 수 조회
      const { count } = await supabase
        .from("generated_contents")
        .select("*", { count: "exact", head: true })
        .eq("sponsorship_id", sponsorshipId);

      await supabase.from("generated_contents").insert({
        sponsorship_id: sponsorshipId,
        user_id: user.id,
        caption: content.caption,
        hashtags: content.hashtags,
        version: (count || 0) + 1,
      });

      // 협찬 상태 업데이트
      await supabase
        .from("sponsorships")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sponsorshipId)
        .eq("user_id", user.id);
    }

    // 7. agent_usage 기록
    await recordUsage(
      supabase,
      user.id,
      "content_generation",
      sponsorshipId,
      tokensUsed,
      model
    );

    return NextResponse.json({
      content,
      remaining: usage.remaining - 1,
    });
  } catch (error) {
    console.error("콘텐츠 생성 에러:", error);

    const message =
      error instanceof Error && error.message.includes("rate_limit")
        ? "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요."
        : "콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 스트림을 래핑하여 완료 시 DB 저장
function wrapStreamWithSave(
  originalStream: ReadableStream<Uint8Array>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sponsorshipId: string | null,
  model: string,
  remaining: number
): ReadableStream<Uint8Array> {
  const reader = originalStream.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      // 원본 데이터를 그대로 전달
      controller.enqueue(value);

      // done 이벤트를 감지하여 DB 저장
      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === "done" && data.content) {
            // generated_contents에 저장
            if (sponsorshipId) {
              const { count } = await supabase
                .from("generated_contents")
                .select("*", { count: "exact", head: true })
                .eq("sponsorship_id", sponsorshipId);

              await supabase.from("generated_contents").insert({
                sponsorship_id: sponsorshipId,
                user_id: userId,
                caption: data.content.caption,
                hashtags: data.content.hashtags,
                version: (count || 0) + 1,
              });

              await supabase
                .from("sponsorships")
                .update({
                  status: "accepted",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", sponsorshipId)
                .eq("user_id", userId);
            }

            // 사용량 기록
            await recordUsage(
              supabase,
              userId,
              "content_generation",
              sponsorshipId,
              data.tokensUsed || 0,
              model
            );

            // 남은 횟수를 클라이언트에 추가 전송
            const remainingData = JSON.stringify({
              type: "usage",
              remaining: remaining - 1,
            });
            controller.enqueue(
              encoder.encode(`data: ${remainingData}\n\n`)
            );
          }
        } catch {
          // JSON 파싱 실패는 무시 (부분 데이터일 수 있음)
        }
      }
    },
  });
}
