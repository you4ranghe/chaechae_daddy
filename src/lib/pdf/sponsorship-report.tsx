"use client";

import { Document, Page, View, Text } from "@react-pdf/renderer";
import { ensurePdfFontsRegistered, pdfColors as c, pdfFonts as f, formatDateTime, formatWon } from "./setup";
import {
  PageHeader,
  PageFooter,
  SectionTitle,
  CoverHero,
  KpiCard,
  Chip,
  PanelCard,
  styles,
} from "./components";
import type { Sponsorship, GeneratedContent } from "@/lib/types/sponsorship";

ensurePdfFontsRegistered();

const STATUS_LABEL: Record<Sponsorship["status"], string> = {
  pending: "대기 중",
  accepted: "진행 중",
  completed: "완료",
  rejected: "거절",
  analyzing: "분석 중",
};

export interface SponsorshipReportProps {
  sponsorship: Sponsorship;
  content: GeneratedContent | null;
  handle: string;
  generatedAt: Date;
}

export function SponsorshipReport({
  sponsorship: sp,
  content,
  handle,
  generatedAt,
}: SponsorshipReportProps) {
  const analysis = sp.analysis;
  const score = analysis?.score;
  const accent =
    score && score.value >= 7 ? "emerald" : score && score.value >= 4 ? "brand" : "rose";

  return (
    <Document
      title={`MomsUp — ${sp.brand_name} 협찬 리포트`}
      author="MomsUp"
      creator="MomsUp"
    >
      {/* ─── 표지 ─────────────────────────────────── */}
      <Page size="A4" style={{ fontFamily: f.body, backgroundColor: c.ink[900] }}>
        <CoverHero
          eyebrow="SPONSORSHIP REPORT"
          title={`${sp.brand_name}\n협찬 리포트`}
          subtitle={
            analysis
              ? `${analysis.brand.product} · ${analysis.brand.industry} 카테고리. AI 분석 점수 ${score?.value}/10 (${score?.recommendation}).`
              : "분석 데이터가 없어 기본 정보만 표기됩니다."
          }
          meta={[
            { label: "인플루언서", value: handle },
            { label: "상태", value: STATUS_LABEL[sp.status] },
            {
              label: "단가",
              value: sp.payment_amount > 0 ? formatWon(sp.payment_amount) : "협의",
            },
            { label: "분석일", value: formatDateTime(sp.created_at) },
          ]}
          accent={accent}
        />
      </Page>

      {/* ─── 페이지 2: 분석 결과 ──────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight={`${sp.brand_name} · 분석`} />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="AI ANALYSIS"
            title="협찬 조건 분석"
            desc="AI가 협찬 DM을 분석해 핵심 조건과 의사결정 포인트를 정리했어요."
          />

          {/* KPI */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            <KpiCard
              label="AI 점수"
              value={score ? `${score.value} / 10` : "-"}
              hint={score?.recommendation}
              tone={accent}
            />
            <KpiCard
              label="유형"
              value={analysis?.conditions.type || "-"}
              tone="brand"
            />
            <KpiCard
              label="페이먼트"
              value={analysis?.conditions.payment || "-"}
              tone="amber"
            />
            <KpiCard
              label="마감"
              value={analysis?.conditions.deadline || sp.deadline || "미정"}
              tone="rose"
            />
          </View>

          {/* 브랜드 정보 */}
          <View style={{ marginBottom: 12 }}>
            <PanelCard title="브랜드 정보">
              <View style={{ flexDirection: "row", gap: 16 }}>
                <InfoBlock label="브랜드" value={analysis?.brand.name || sp.brand_name} />
                <InfoBlock label="제품" value={analysis?.brand.product || sp.product || "-"} />
                <InfoBlock label="업종" value={analysis?.brand.industry || "-"} />
              </View>
            </PanelCard>
          </View>

          {/* 요구사항 */}
          {analysis && analysis.conditions.requirements.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <PanelCard title="협찬 요구사항">
                {analysis.conditions.requirements.map((req, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 6, marginTop: i === 0 ? 0 : 6 }}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: c.brand[500],
                        marginTop: 5,
                      }}
                    />
                    <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], flex: 1, lineHeight: 1.5 }}>
                      {req}
                    </Text>
                  </View>
                ))}
              </PanelCard>
            </View>
          )}

          {/* 장단점 */}
          {analysis && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PanelCard title="장점" tone="emerald">
                  {analysis.pros.map((item, i) => (
                    <Text
                      key={i}
                      style={{
                        fontFamily: f.body,
                        fontSize: 9.5,
                        color: c.ink[700],
                        lineHeight: 1.5,
                        marginTop: i === 0 ? 0 : 4,
                      }}
                    >
                      · {item}
                    </Text>
                  ))}
                </PanelCard>
              </View>
              <View style={{ flex: 1 }}>
                <PanelCard title="주의할 점" tone="rose">
                  {analysis.cons.map((item, i) => (
                    <Text
                      key={i}
                      style={{
                        fontFamily: f.body,
                        fontSize: 9.5,
                        color: c.ink[700],
                        lineHeight: 1.5,
                        marginTop: i === 0 ? 0 : 4,
                      }}
                    >
                      · {item}
                    </Text>
                  ))}
                </PanelCard>
              </View>
            </View>
          )}

          {/* AI 점수 근거 */}
          {score?.reasoning && (
            <View style={{ marginTop: 12 }}>
              <PanelCard title="AI 추천 근거" tone={accent}>
                <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], lineHeight: 1.6 }}>
                  {score.reasoning}
                </Text>
              </PanelCard>
            </View>
          )}
        </View>
        <PageFooter />
      </Page>

      {/* ─── 페이지 3: 응답 초안 ──────────────────── */}
      {analysis && (
        <Page size="A4" style={styles.page}>
          <PageHeader metaRight={`${sp.brand_name} · 응답 초안`} />
          <View style={styles.pageContent}>
            <SectionTitle
              eyebrow="REPLY DRAFTS"
              title="AI 응답 초안 3종"
              desc="협찬사에 바로 보낼 수 있는 초안이에요. 톤은 그대로 두고 상황에 맞춰 한두 문장만 수정해보세요."
            />

            <View style={{ marginBottom: 12 }}>
              <PanelCard title="수락" tone="emerald">
                <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], lineHeight: 1.6 }}>
                  {analysis.responses.accept}
                </Text>
              </PanelCard>
            </View>

            <View style={{ marginBottom: 12 }}>
              <PanelCard title="협상" tone="amber">
                <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], lineHeight: 1.6 }}>
                  {analysis.responses.negotiate}
                </Text>
              </PanelCard>
            </View>

            <PanelCard title="거절" tone="rose">
              <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], lineHeight: 1.6 }}>
                {analysis.responses.reject}
              </Text>
            </PanelCard>
          </View>
          <PageFooter />
        </Page>
      )}

      {/* ─── 페이지 4: 생성된 콘텐츠 ─────────────── */}
      {content && (
        <Page size="A4" style={styles.page}>
          <PageHeader metaRight={`${sp.brand_name} · 콘텐츠 초안`} />
          <View style={styles.pageContent}>
            <SectionTitle
              eyebrow="CONTENT DRAFT"
              title="인스타용 콘텐츠 초안"
              desc="AI가 생성한 캡션과 해시태그입니다. 인스타그램 본문과 첫 댓글에 그대로 활용 가능해요."
            />

            <View style={{ marginBottom: 12 }}>
              <PanelCard title={`캡션 · ${content.caption.length}자`}>
                <Text
                  style={{
                    fontFamily: f.body,
                    fontSize: 10.5,
                    color: c.ink[800],
                    lineHeight: 1.7,
                  }}
                >
                  {content.caption}
                </Text>
              </PanelCard>
            </View>

            {content.hashtags.length > 0 && (
              <PanelCard title={`해시태그 · ${content.hashtags.length}개`} tone="amber">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                  {content.hashtags.map((tag, i) => (
                    <Chip key={i} label={tag.startsWith("#") ? tag : `#${tag}`} tone="amber" />
                  ))}
                </View>
              </PanelCard>
            )}

            {sp.checklist && sp.checklist.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <PanelCard title="포스팅 전 체크리스트" tone="emerald">
                  {sp.checklist.map((item, i) => (
                    <View key={item.id} style={{ flexDirection: "row", gap: 6, marginTop: i === 0 ? 0 : 5 }}>
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 2,
                          borderWidth: 0.8,
                          borderColor: c.emerald[600],
                          marginTop: 2,
                          backgroundColor: c.white,
                        }}
                      />
                      <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], flex: 1, lineHeight: 1.5 }}>
                        {item.text}
                      </Text>
                    </View>
                  ))}
                </PanelCard>
              </View>
            )}
          </View>
          <PageFooter />
        </Page>
      )}

      {/* ─── 마지막: 메타 ─────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight="문서 정보" />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="DOCUMENT INFO"
            title="리포트 메타데이터"
            desc="이 PDF는 협찬 의사결정 기록을 위한 자동 생성 문서예요."
          />
          <PanelCard title="기본 정보">
            <View style={{ gap: 6 }}>
              <MetaRow label="협찬 ID" value={sp.id} mono />
              <MetaRow label="브랜드" value={sp.brand_name} />
              <MetaRow label="제품" value={sp.product || "-"} />
              <MetaRow label="현재 상태" value={STATUS_LABEL[sp.status]} />
              <MetaRow
                label="페이먼트"
                value={sp.payment_amount > 0 ? formatWon(sp.payment_amount) : "협의"}
              />
              <MetaRow label="마감일" value={sp.deadline || "미정"} />
              <MetaRow label="생성일" value={formatDateTime(sp.created_at)} />
              <MetaRow label="리포트 생성" value={formatDateTime(generatedAt)} />
            </View>
          </PanelCard>
        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: f.display,
          fontSize: 7,
          color: c.ink[400],
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: f.display,
          fontWeight: 700,
          fontSize: 12,
          color: c.ink[900],
          marginTop: 3,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.4, borderBottomColor: c.ink[100] }}>
      <Text style={{ fontFamily: f.body, fontSize: 9, color: c.ink[500], width: 90 }}>{label}</Text>
      <Text
        style={{
          fontFamily: mono ? f.body : f.display,
          fontSize: 9.5,
          color: c.ink[800],
          flex: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
