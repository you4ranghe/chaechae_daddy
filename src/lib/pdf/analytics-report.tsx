"use client";

import { Document, Page, View, Text } from "@react-pdf/renderer";
import { ensurePdfFontsRegistered, pdfColors as c, pdfFonts as f, formatDateTime } from "./setup";
import {
  PageHeader,
  PageFooter,
  SectionTitle,
  CoverHero,
  KpiCard,
  PanelCard,
  Chip,
  styles,
} from "./components";
import type { AnalyticsReport } from "@/lib/agents/analytics-agent";

ensurePdfFontsRegistered();

export interface AnalyticsReportPdfProps {
  report: AnalyticsReport;
  handle: string;
  reportDate: Date;
  generatedAt: Date;
}

export function AnalyticsReportPdf({ report, handle, reportDate, generatedAt }: AnalyticsReportPdfProps) {
  const score = report.competitiveness.overallScore;
  const accent = score >= 75 ? "emerald" : score >= 60 ? "brand" : score >= 40 ? "amber" : "rose";

  return (
    <Document
      title={`MomsUp — ${handle} 주간 성과 분석`}
      author="MomsUp"
      creator="MomsUp"
    >
      {/* ─── 표지 ─── */}
      <Page size="A4" style={{ fontFamily: f.body, backgroundColor: c.ink[900] }}>
        <CoverHero
          eyebrow="WEEKLY PERFORMANCE REPORT"
          title={`${handle}님의\n주간 성과 분석`}
          subtitle="MomsUp가 인스타그램 인사이트 데이터를 분석해 다음 주 전략까지 정리했어요."
          meta={[
            { label: "리포트 일자", value: formatDateTime(reportDate) },
            { label: "경쟁력 점수", value: `${score} / 100` },
            { label: "티어", value: report.competitiveness.tier },
            { label: "참여율", value: report.competitiveness.engagementRate },
          ]}
          accent={accent === "amber" ? "rose" : accent}
        />
      </Page>

      {/* ─── 페이지 2: 경쟁력 요약 ─── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight="경쟁력 · Competitiveness" />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="OVERALL"
            title={`경쟁력 점수 ${score}`}
            desc={`${report.competitiveness.tier} — 인스타그램 마이크로 인플루언서 벤치마크 기준으로 평가된 점수예요.`}
          />

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            <KpiCard
              label="참여율"
              value={report.competitiveness.engagementRate}
              hint={report.competitiveness.engagementVerdict}
              tone={accent === "amber" ? "amber" : accent === "emerald" ? "emerald" : "brand"}
            />
            <KpiCard label="도달 효율" value={report.competitiveness.reachEfficiency} tone="brand" />
            <KpiCard label="저장률" value={report.competitiveness.saveRate} tone="amber" />
            <KpiCard label="성장률" value={report.competitiveness.growthRate} tone="rose" />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PanelCard title="잘한 점" tone="emerald">
                {report.summary.highlights.map((h, i) => (
                  <Text
                    key={i}
                    style={{
                      fontFamily: f.body,
                      fontSize: 10,
                      color: c.ink[700],
                      lineHeight: 1.6,
                      marginTop: i === 0 ? 0 : 5,
                    }}
                  >
                    + {h}
                  </Text>
                ))}
              </PanelCard>
            </View>
            <View style={{ flex: 1 }}>
              <PanelCard title="개선할 점" tone="amber">
                {report.summary.improvements.map((im, i) => (
                  <Text
                    key={i}
                    style={{
                      fontFamily: f.body,
                      fontSize: 10,
                      color: c.ink[700],
                      lineHeight: 1.6,
                      marginTop: i === 0 ? 0 : 5,
                    }}
                  >
                    − {im}
                  </Text>
                ))}
              </PanelCard>
            </View>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ─── 페이지 3: 최고 성과 + 전략 ─── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight="전략 · Strategy" />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="TOP POST ANALYSIS"
            title="최고 성과 게시물"
            desc="가장 반응이 좋았던 게시물을 분석하고, 다음에도 반복할 수 있는 공식을 찾았어요."
          />

          <PanelCard title={report.topPostAnalysis.postTitle} tone="brand">
            <Text
              style={{
                fontFamily: f.display,
                fontWeight: 700,
                fontSize: 10,
                color: c.brand[700],
                marginBottom: 4,
              }}
            >
              왜 잘됐을까?
            </Text>
            <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], lineHeight: 1.6, marginBottom: 10 }}>
              {report.topPostAnalysis.whyItWorked}
            </Text>

            <Text
              style={{
                fontFamily: f.display,
                fontWeight: 700,
                fontSize: 10,
                color: c.brand[700],
                marginBottom: 4,
              }}
            >
              반복 전략
            </Text>
            <Text style={{ fontFamily: f.body, fontSize: 10, color: c.ink[700], lineHeight: 1.6 }}>
              {report.topPostAnalysis.replicateStrategy}
            </Text>
          </PanelCard>

          <View style={{ marginTop: 14 }}>
            <SectionTitle eyebrow="NEXT WEEK" title="다음 주 추천 전략" />

            <PanelCard title="콘텐츠 믹스 + 핵심 주제" tone="brand">
              <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 11, color: c.ink[900], marginBottom: 6 }}>
                {report.nextWeekStrategy.contentMix}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {report.nextWeekStrategy.focusTopics.map((t, i) => (
                  <Chip key={i} label={t} tone="brand" />
                ))}
              </View>
              <Text style={{ fontFamily: f.body, fontSize: 9.5, color: c.ink[600], lineHeight: 1.6 }}>
                {report.nextWeekStrategy.captionTips}
              </Text>
              <Text style={{ fontFamily: f.body, fontSize: 9.5, color: c.ink[600], lineHeight: 1.6, marginTop: 4 }}>
                {report.nextWeekStrategy.hashtagAdvice}
              </Text>
            </PanelCard>
          </View>

          <View style={{ marginTop: 14 }}>
            <PanelCard title="최적 업로드 시간" tone="amber">
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: f.body, fontSize: 8.5, color: c.ink[400], letterSpacing: 0.5 }}>
                    평일
                  </Text>
                  <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 13, color: c.ink[900], marginTop: 3 }}>
                    {report.bestTimes.weekday}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: f.body, fontSize: 8.5, color: c.ink[400], letterSpacing: 0.5 }}>
                    주말
                  </Text>
                  <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 13, color: c.ink[900], marginTop: 3 }}>
                    {report.bestTimes.weekend}
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: f.body, fontSize: 9.5, color: c.ink[600], lineHeight: 1.6 }}>
                {report.bestTimes.reasoning}
              </Text>
            </PanelCard>
          </View>
        </View>
        <PageFooter note={`리포트 생성: ${formatDateTime(generatedAt)} · MomsUp`} />
      </Page>
    </Document>
  );
}
