"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  SponsorshipAnalysis,
  ChecklistItem,
  GeneratedContent,
} from "@/lib/types/sponsorship";
import { AnalysisResult } from "./analysis-result";
import { ContentResult } from "./content-result";

type Phase = "input" | "analyzed" | "content" | "streaming" | "limit_exceeded";

interface LimitInfo {
  message: string;
  plan: string;
}

interface DuplicateBrand {
  count: number;
  lastStatus: string;
  lastAmount: number;
  lastDate: string;
}

export function NewAnalysisTab() {
  const router = useRouter();
  const [dmContent, setDmContent] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [analyzing, setAnalyzing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<SponsorshipAnalysis | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [sponsorshipId, setSponsorshipId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [duplicateBrand, setDuplicateBrand] = useState<DuplicateBrand | null>(null);

  async function handleAnalyze() {
    if (dmContent.trim().length < 10) {
      setError("DM 내용을 10자 이상 입력해주세요.");
      return;
    }

    setError("");
    setAnalyzing(true);

    try {
      const res = await fetch("/api/agent/sponsorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dmContent }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setLimitInfo({ message: data.error, plan: data.plan });
        setPhase("limit_exceeded");
        return;
      }

      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다.");
        return;
      }

      // DB에 저장된 sponsorship ID가 있으면 상세 페이지로 이동
      // → 새로고침해도 결과가 보존되고, 콘텐츠 생성도 거기서 이어서 진행
      if (data.sponsorshipId) {
        router.push(`/dashboard/sponsorships/${data.sponsorshipId}`);
        return;
      }

      // ID 저장 실패 등 fallback: 기존 인라인 흐름 유지
      setAnalysis(data.analysis);
      setChecklist(data.checklist);
      setSponsorshipId(data.sponsorshipId);
      setDuplicateBrand(data.duplicateBrand || null);
      setPhase("analyzed");
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAccept() {
    if (!analysis || !checklist) return;

    setAccepting(true);
    setError("");
    setStreamingText("");
    setPhase("streaming");

    try {
      const res = await fetch("/api/agent/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorshipId,
          analysis,
          checklist,
          stream: true,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setLimitInfo({ message: data.error, plan: data.plan });
        setPhase("limit_exceeded");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "콘텐츠 생성에 실패했습니다.");
        setPhase("analyzed");
        return;
      }

      // SSE 스트리밍 읽기
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "text_delta") {
              setStreamingText(function (prev) {
                return prev + data.text;
              });
            } else if (data.type === "done" && data.content) {
              setContent(data.content);
              setPhase("content");
            } else if (data.type === "error") {
              setError(data.error);
              setPhase("analyzed");
            }
          } catch {
            // 부분 JSON 무시
          }
        }
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setPhase("analyzed");
    } finally {
      setAccepting(false);
    }
  }

  function translateStatus(status: string): string {
    if (status === "pending") return "대기";
    if (status === "accepted") return "진행 중";
    if (status === "rejected") return "거절";
    if (status === "completed") return "완료";
    return status;
  }

  function handleReset() {
    setDmContent("");
    setPhase("input");
    setAnalysis(null);
    setChecklist([]);
    setContent(null);
    setSponsorshipId(null);
    setStreamingText("");
    setLimitInfo(null);
    setError("");
    setDuplicateBrand(null);
  }

  return (
    <div>
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 사용량 초과 안내 */}
      {phase === "limit_exceeded" && limitInfo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0 text-amber-500 mt-0.5">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                사용량 한도에 도달했어요
              </h3>
              <p className="mt-2 text-sm text-amber-700 whitespace-pre-line leading-relaxed">
                {limitInfo.message}
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/dashboard/usage"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  플랜 업그레이드
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase: DM 입력 */}
      {phase === "input" && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <label
              htmlFor="dm-input"
              className="block text-sm font-medium text-gray-700"
            >
              협찬 DM 내용을 붙여넣으세요
            </label>
            <textarea
              id="dm-input"
              rows={10}
              value={dmContent}
              onChange={(e) => setDmContent(e.target.value)}
              placeholder={`예시:\n안녕하세요! ○○브랜드 담당자입니다.\n@님의 피드를 보고 연락드립니다.\n저희 신제품 체험 후 피드 1회 포스팅 부탁드리고 싶습니다.\n제품 무상 제공 + 원고료 10만원 지급 예정이며,\n@브랜드 태그, #광고 표시 부탁드립니다.\n마감은 3월 말까지입니다.`}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
            />
            <p className="mt-2 text-xs text-gray-400">
              협찬 DM 전체 내용을 그대로 복사해서 붙여넣으세요. AI가 자동으로 분석합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || dmContent.trim().length < 10}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI 분석 중...
              </span>
            ) : (
              "AI 분석하기"
            )}
          </button>
        </>
      )}

      {/* Phase: 분석 완료 */}
      {phase === "analyzed" && analysis && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">분석 결과</h3>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              새로 분석하기
            </button>
          </div>
          {duplicateBrand && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-amber-500 mt-0.5">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">
                    이미 협찬했던 브랜드예요 ({duplicateBrand.count}회)
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    가장 최근 협찬:{" "}
                    {new Date(duplicateBrand.lastDate).toLocaleDateString("ko-KR")}
                    {duplicateBrand.lastAmount > 0 && (
                      <> · ₩{duplicateBrand.lastAmount.toLocaleString()}</>
                    )}
                    {" "}({translateStatus(duplicateBrand.lastStatus)})
                  </p>
                  <p className="mt-1 text-[11px] text-amber-700">
                    이전 협상 조건과 비교해 가격·요구사항이 합리적인지 확인해 보세요.
                  </p>
                </div>
              </div>
            </div>
          )}
          <AnalysisResult
            analysis={analysis}
            checklist={checklist}
            onAccept={handleAccept}
            accepting={accepting}
          />
        </>
      )}

      {/* Phase: 스트리밍 중 */}
      {phase === "streaming" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 className="text-sm font-medium text-indigo-600">
              AI가 콘텐츠를 생성하고 있어요...
            </h3>
          </div>
          {streamingText && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {streamingText}
              </p>
              <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          )}
        </div>
      )}

      {/* Phase: 콘텐츠 생성 완료 */}
      {phase === "content" && analysis && content && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">
              <span className="text-indigo-600 font-semibold">{analysis.brand.name}</span> 콘텐츠
            </h3>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              새로 분석하기
            </button>
          </div>
          <ContentResult checklist={checklist} content={content} />
        </>
      )}
    </div>
  );
}
