"use client";

import { Document, Page, View, Text } from "@react-pdf/renderer";
import { ensurePdfFontsRegistered, pdfColors as c, pdfFonts as f, formatWon, formatDate } from "./setup";
import {
  PageHeader,
  PageFooter,
  SectionTitle,
  CoverHero,
  KpiCard,
  BarChart,
  DonutChart,
  DataTable,
  PanelCard,
  styles,
} from "./components";
import type { InsightsData } from "@/lib/db/insights";

ensurePdfFontsRegistered();

export interface InsightsReportProps {
  data: InsightsData;
  handle: string;
  generatedAt: Date;
}

export function InsightsReport({ data, handle, generatedAt }: InsightsReportProps) {
  const periodEnd = generatedAt;
  const periodStart = new Date(periodEnd);
  periodStart.setMonth(periodStart.getMonth() - 5);
  periodStart.setDate(1);

  const periodLabel = `${formatDate(periodStart)} – ${formatDate(periodEnd)}`;

  const monthlyMax = Math.max(...data.monthlyRevenue.map((m) => m.revenue), 0);
  const bestMonth = data.monthlyRevenue.reduce(
    (best, m) => (m.revenue > best.revenue ? m : best),
    data.monthlyRevenue[0] || { month: "-", revenue: 0, count: 0 },
  );

  return (
    <Document
      title={`MomsUp — ${handle} 인사이트 리포트`}
      author="MomsUp"
      creator="MomsUp"
    >
      {/* ─── 표지 ─────────────────────────────────── */}
      <Page size="A4" style={{ fontFamily: f.body, backgroundColor: c.ink[900] }}>
        <CoverHero
          eyebrow="INFLUENCER INSIGHTS REPORT"
          title={`${handle}님의\n6개월 협찬 인사이트`}
          subtitle="MomsUp가 협찬 데이터를 분석해 수익 추이, 핵심 브랜드, 업종 단가를 한 권으로 정리해드려요."
          meta={[
            { label: "리포트 기간", value: periodLabel },
            { label: "총 수익", value: formatWon(data.totals.revenue) },
            { label: "완료 협찬", value: `${data.totals.completedCount}건` },
            { label: "수락률", value: `${data.totals.acceptRate}%` },
          ]}
        />
      </Page>

      {/* ─── 페이지 2: 요약 ───────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight="요약 · Summary" />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="EXECUTIVE SUMMARY"
            title="이번 6개월의 한눈에"
            desc="완료 처리된 협찬을 기준으로 핵심 수치를 정리했어요. 모든 금액은 부가세 포함 표기 금액 기준이에요."
          />

          {/* KPI 4개 */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            <KpiCard label="총 수익" value={formatWon(data.totals.revenue)} hint="완료 협찬 합산" tone="brand" />
            <KpiCard label="완료 협찬" value={`${data.totals.completedCount}건`} tone="emerald" />
            <KpiCard label="수락률" value={`${data.totals.acceptRate}%`} hint="의사결정 기준" tone="amber" />
            <KpiCard
              label="베스트 월"
              value={bestMonth.month}
              hint={formatWon(bestMonth.revenue)}
              tone="rose"
            />
          </View>

          {/* 월별 그래프 */}
          <PanelCard
            title="월별 협찬 수익 추이"
            desc="완료 처리한 협찬만 집계해요. 가장 높은 달은 그래프 위에 표시돼요."
          >
            {monthlyMax === 0 ? (
              <EmptyHint text="아직 완료 처리된 협찬이 없어요" />
            ) : (
              <BarChart
                data={data.monthlyRevenue.map((m) => ({ label: m.month, value: m.revenue }))}
                width={500}
                height={180}
                formatValue={(v) => {
                  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}천만`;
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}백만`;
                  if (v >= 10_000) return `${Math.round(v / 10_000)}만`;
                  return v.toLocaleString();
                }}
              />
            )}
          </PanelCard>

          {/* 상태 분포 + 안내 */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <PanelCard title="협찬 상태 분포" desc="6개월간 받은 모든 협찬을 단계별로" tone="emerald">
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <DonutChart
                    data={[
                      { label: "완료", value: data.statusBreakdown.completed, color: c.emerald[500] },
                      { label: "진행", value: data.statusBreakdown.accepted, color: c.brand[500] },
                      { label: "대기", value: data.statusBreakdown.pending, color: c.amber[500] },
                      { label: "거절", value: data.statusBreakdown.rejected, color: c.rose[500] },
                    ]}
                    size={130}
                    centerValue={`${
                      data.statusBreakdown.completed +
                      data.statusBreakdown.accepted +
                      data.statusBreakdown.pending +
                      data.statusBreakdown.rejected
                    }`}
                    centerLabel="총 협찬"
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <LegendRow color={c.emerald[500]} label="완료" value={data.statusBreakdown.completed} />
                    <LegendRow color={c.brand[500]} label="진행 중" value={data.statusBreakdown.accepted} />
                    <LegendRow color={c.amber[500]} label="대기" value={data.statusBreakdown.pending} />
                    <LegendRow color={c.rose[500]} label="거절" value={data.statusBreakdown.rejected} />
                  </View>
                </View>
              </PanelCard>
            </View>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ─── 페이지 3: 브랜드 TOP ─────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight="브랜드 · Brands" />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="TOP BRANDS"
            title="자주 협업한 브랜드"
            desc="최근 6개월간 협찬 제안을 보낸 브랜드를 협업 횟수와 누적 수익으로 정리했어요."
          />

          {data.brandStats.length === 0 ? (
            <PanelCard title="브랜드 데이터" desc="아직 분석된 브랜드 데이터가 없어요" tone="brand">
              <EmptyHint text="새 협찬을 분석하면 자동으로 채워져요" />
            </PanelCard>
          ) : (
            <DataTable
              columns={[
                {
                  key: "rank",
                  header: "#",
                  width: 0.4,
                  align: "center",
                  accessor: (row) => `${row._rank}`,
                },
                { key: "brand", header: "브랜드", width: 2.6, accessor: (row) => row.brand },
                {
                  key: "count",
                  header: "횟수",
                  width: 1,
                  align: "right",
                  accessor: (row) => `${row.count}건`,
                },
                {
                  key: "revenue",
                  header: "누적 수익",
                  width: 1.6,
                  align: "right",
                  accessor: (row) => formatWon(row.revenue),
                },
                {
                  key: "last",
                  header: "최근 연락",
                  width: 1.4,
                  align: "right",
                  accessor: (row) => formatDate(row.lastDate),
                },
              ]}
              rows={data.brandStats.slice(0, 15).map((b, i) => ({ ...b, _rank: i + 1 }))}
            />
          )}
        </View>
        <PageFooter />
      </Page>

      {/* ─── 페이지 4: 업종 단가 ─────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader metaRight="업종 단가 · Industry Pricing" />
        <View style={styles.pageContent}>
          <SectionTitle
            eyebrow="INDUSTRY PRICING"
            title="업종별 단가 분포"
            desc="완료 처리한 협찬의 페이먼트를 업종별로 묶어 중앙값·최대·최소를 보여드려요. 새 협상 시 기준점으로 활용하세요."
          />

          {data.industryPrices.length === 0 ? (
            <PanelCard title="업종 단가" desc="유상 협찬이 충분히 쌓이면 자동으로 표시돼요" tone="amber">
              <EmptyHint text="완료된 유상 협찬이 부족해요" />
            </PanelCard>
          ) : (
            <DataTable
              columns={[
                { key: "industry", header: "업종", width: 2, accessor: (row) => row.industry },
                {
                  key: "count",
                  header: "샘플",
                  width: 0.8,
                  align: "right",
                  accessor: (row) => `${row.count}건`,
                },
                {
                  key: "median",
                  header: "중앙값",
                  width: 1.6,
                  align: "right",
                  accessor: (row) => formatWon(row.median),
                },
                {
                  key: "min",
                  header: "최소",
                  width: 1.4,
                  align: "right",
                  accessor: (row) => formatWon(row.min),
                },
                {
                  key: "max",
                  header: "최대",
                  width: 1.4,
                  align: "right",
                  accessor: (row) => formatWon(row.max),
                },
              ]}
              rows={data.industryPrices}
            />
          )}

          {/* 작은 안내 */}
          <View
            style={{
              marginTop: 18,
              borderRadius: 8,
              padding: 12,
              backgroundColor: c.brand[50],
              borderWidth: 0.6,
              borderColor: c.brand[100],
            }}
          >
            <Text
              style={{
                fontFamily: f.display,
                fontWeight: 700,
                fontSize: 10,
                color: c.brand[700],
                marginBottom: 4,
              }}
            >
              협상 팁
            </Text>
            <Text style={{ fontFamily: f.body, fontSize: 9, color: c.ink[700], lineHeight: 1.5 }}>
              새 협찬 단가를 결정할 때는 위 중앙값을 기준선으로 두고, 본인 채널의 평균 인게이지먼트와 카테고리 적합도에 따라 ±20~30% 범위에서 협상하세요. MomsUp의 응답 초안에 “업종 평균 단가”를 인용하면 설득력이 올라가요.
            </Text>
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontFamily: f.body, fontSize: 9, color: c.ink[600], flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 10, color: c.ink[900] }}>
        {value}건
      </Text>
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <View
      style={{
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.ink[50],
        borderRadius: 6,
      }}
    >
      <Text style={{ fontFamily: f.body, fontSize: 9, color: c.ink[500] }}>{text}</Text>
    </View>
  );
}
