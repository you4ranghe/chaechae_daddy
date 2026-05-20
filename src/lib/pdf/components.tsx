"use client";

import {
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
  Rect,
  Circle,
  G,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";
import { pdfColors as c, pdfFonts as f } from "./setup";

export const styles = StyleSheet.create({
  page: {
    fontFamily: f.body,
    fontSize: 10,
    color: c.ink[800],
    backgroundColor: c.white,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  pageContent: {
    flex: 1,
  },
  display: { fontFamily: f.display },
  bold: { fontFamily: f.display, fontWeight: 700 },
  pageHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginBottom: 18,
    borderBottomWidth: 0.6,
    borderBottomColor: c.ink[200],
  },
  pageBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageBrandDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: c.brand[600],
  },
  pageBrandName: {
    fontFamily: f.display,
    fontWeight: 700,
    fontSize: 10,
    color: c.ink[900],
    letterSpacing: 0.5,
  },
  pageBrandTag: {
    fontFamily: f.body,
    fontSize: 8,
    color: c.ink[500],
  },
  pageMeta: {
    fontFamily: f.body,
    fontSize: 8,
    color: c.ink[500],
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 0.4,
    borderTopColor: c.ink[200],
  },
  footerText: {
    fontFamily: f.body,
    fontSize: 8,
    color: c.ink[400],
  },
  sectionLabel: {
    fontFamily: f.display,
    fontSize: 8,
    fontWeight: 700,
    color: c.brand[600],
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: f.display,
    fontWeight: 700,
    fontSize: 16,
    color: c.ink[900],
    marginBottom: 12,
  },
  sectionDesc: {
    fontFamily: f.body,
    fontSize: 9.5,
    color: c.ink[500],
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 1.5,
  },
});

// ─── 페이지 헤더 ─────────────────────────────────
export function PageHeader({ title, metaRight }: { title?: string; metaRight?: string }) {
  return (
    <View style={styles.pageHeaderRow} fixed>
      <View style={styles.pageBrand}>
        <View style={styles.pageBrandDot} />
        <Text style={styles.pageBrandName}>MomsUp</Text>
        <Text style={styles.pageBrandTag}>· Creator Workspace</Text>
      </View>
      <Text style={styles.pageMeta}>{metaRight || title || ""}</Text>
    </View>
  );
}

// ─── 페이지 푸터 ─────────────────────────────────
export function PageFooter({ note }: { note?: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{note || "이 리포트는 MomsUp에서 자동 생성되었습니다."}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

// ─── 섹션 제목 ────────────────────────────────────
export function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <View>
      {eyebrow && <Text style={styles.sectionLabel}>{eyebrow}</Text>}
      <Text style={styles.sectionTitle}>{title}</Text>
      {desc && <Text style={styles.sectionDesc}>{desc}</Text>}
    </View>
  );
}

// ─── 표지 ────────────────────────────────────────
export function CoverHero({
  eyebrow,
  title,
  subtitle,
  meta,
  accent = "brand",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  accent?: "brand" | "emerald" | "rose";
}) {
  const accentColor =
    accent === "emerald" ? c.emerald[600] : accent === "rose" ? c.rose[600] : c.brand[600];
  const accentSoft =
    accent === "emerald" ? c.emerald[100] : accent === "rose" ? c.rose[100] : c.brand[100];

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: c.ink[900],
        padding: 56,
        justifyContent: "space-between",
      }}
    >
      <Svg
        style={{ position: "absolute", top: 0, left: 0 }}
        width={595}
        height={842}
        viewBox="0 0 595 842"
      >
        <Defs>
          <LinearGradient id="coverBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={accentColor} stopOpacity="0.35" />
            <Stop offset="1" stopColor={c.ink[900]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="595" height="842" fill="url(#coverBg)" />
        <Circle cx="500" cy="160" r="220" fill={accentColor} opacity="0.18" />
        <Circle cx="120" cy="700" r="180" fill={c.purple[500]} opacity="0.16" />
        <Circle cx="450" cy="600" r="90" fill={c.pink[500]} opacity="0.18" />
      </Svg>

      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor: c.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: accentColor }} />
          </View>
          <Text
            style={{
              fontFamily: f.display,
              fontWeight: 700,
              fontSize: 12,
              color: c.white,
              letterSpacing: 1,
            }}
          >
            MOMSUP
          </Text>
        </View>

        <View style={{ marginTop: 48 }}>
          <Text
            style={{
              fontFamily: f.display,
              fontWeight: 700,
              fontSize: 10,
              color: accentSoft,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              fontFamily: f.display,
              fontWeight: 700,
              fontSize: 38,
              color: c.white,
              marginTop: 14,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: f.body,
              fontSize: 12,
              color: c.ink[300],
              marginTop: 14,
              lineHeight: 1.6,
              maxWidth: 380,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {meta.map((m, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 0.6,
              borderColor: "rgba(255,255,255,0.18)",
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              minWidth: 120,
            }}
          >
            <Text style={{ fontFamily: f.body, fontSize: 8, color: c.ink[300], letterSpacing: 0.5 }}>
              {m.label}
            </Text>
            <Text
              style={{
                fontFamily: f.display,
                fontWeight: 700,
                fontSize: 14,
                color: c.white,
                marginTop: 4,
              }}
            >
              {m.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── KPI 카드 (큰 숫자 + 라벨) ───────────────────
export function KpiCard({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "emerald" | "rose" | "amber";
}) {
  const toneColor =
    tone === "emerald"
      ? c.emerald[600]
      : tone === "rose"
        ? c.rose[600]
        : tone === "amber"
          ? c.amber[600]
          : c.brand[600];
  const toneSoft =
    tone === "emerald"
      ? c.emerald[100]
      : tone === "rose"
        ? c.rose[100]
        : tone === "amber"
          ? c.amber[100]
          : c.brand[50];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.white,
        borderRadius: 10,
        borderWidth: 0.6,
        borderColor: c.ink[200],
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: toneColor }} />
        <Text style={{ fontFamily: f.body, fontSize: 9, color: c.ink[500] }}>{label}</Text>
      </View>
      <Text
        style={{
          fontFamily: f.display,
          fontWeight: 700,
          fontSize: 22,
          color: c.ink[900],
          marginTop: 8,
        }}
      >
        {value}
      </Text>
      {hint && (
        <View
          style={{
            marginTop: 6,
            alignSelf: "flex-start",
            backgroundColor: toneSoft,
            borderRadius: 4,
            paddingVertical: 2,
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ fontFamily: f.body, fontSize: 8, color: toneColor }}>{hint}</Text>
        </View>
      )}
    </View>
  );
}

// ─── 막대 그래프 (월별 수익 등) ──────────────────
export function BarChart({
  data,
  width = 515,
  height = 200,
  formatValue,
}: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const padding = { top: 20, right: 12, bottom: 32, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = chartW / data.length;
  const barGap = barWidth * 0.3;
  const actualBarWidth = barWidth - barGap;

  // y축 4단계
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.brand[500]} stopOpacity="1" />
          <Stop offset="1" stopColor={c.purple[500]} stopOpacity="0.9" />
        </LinearGradient>
      </Defs>

      {/* y축 그리드/라벨 */}
      {yTicks.map((t, i) => {
        const y = padding.top + chartH * (1 - t);
        const v = Math.round(maxValue * t);
        return (
          <G key={i}>
            <Line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
              stroke={c.ink[200]}
              strokeWidth={0.4}
              strokeDasharray={t === 0 ? undefined : "2 3"}
            />
            <Text
              x={padding.left - 6}
              y={y + 3}
              style={{ fontFamily: f.body, fontSize: 7, color: c.ink[400] }}
            >
              {formatValue ? formatValue(v) : v.toLocaleString()}
            </Text>
          </G>
        );
      })}

      {/* 막대 */}
      {data.map((d, i) => {
        const barH = maxValue > 0 ? (d.value / maxValue) * chartH : 0;
        const x = padding.left + i * barWidth + barGap / 2;
        const y = padding.top + chartH - barH;
        return (
          <G key={i}>
            {barH > 0 && (
              <Rect
                x={x}
                y={y}
                width={actualBarWidth}
                height={barH}
                fill="url(#barGrad)"
                rx={3}
              />
            )}
            <Text
              x={x + actualBarWidth / 2}
              y={padding.top + chartH + 14}
              style={{ fontFamily: f.body, fontSize: 8, color: c.ink[500], textAlign: "center" }}
            >
              {d.label}
            </Text>
            {d.value > 0 && (
              <Text
                x={x + actualBarWidth / 2}
                y={y - 4}
                style={{
                  fontFamily: f.display,
                  fontWeight: 700,
                  fontSize: 7.5,
                  color: c.ink[700],
                  textAlign: "center",
                }}
              >
                {formatValue ? formatValue(d.value) : d.value.toLocaleString()}
              </Text>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

// ─── 도넛 그래프 ──────────────────────────────────
export function DonutChart({
  data,
  size = 160,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = r * 0.65;

  if (total === 0) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} fill={c.ink[100]} />
        <Circle cx={cx} cy={cy} r={innerR} fill={c.white} />
        <Text
          x={cx}
          y={cy + 3}
          style={{
            fontFamily: f.body,
            fontSize: 9,
            color: c.ink[400],
            textAlign: "center",
          }}
        >
          데이터 없음
        </Text>
      </Svg>
    );
  }

  const slices: { path: string; color: string }[] = [];
  let cursor = -Math.PI / 2;
  for (const d of data) {
    const angle = (d.value / total) * Math.PI * 2;
    const endAngle = cursor + angle;
    const x1 = cx + r * Math.cos(cursor);
    const y1 = cy + r * Math.sin(cursor);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    slices.push({ path, color: d.color });
    cursor = endAngle;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <Path key={i} d={s.path} fill={s.color} />
      ))}
      <Circle cx={cx} cy={cy} r={innerR} fill={c.white} />
      {centerValue && (
        <Text
          x={cx}
          y={cy - 2}
          style={{
            fontFamily: f.display,
            fontWeight: 700,
            fontSize: 16,
            color: c.ink[900],
            textAlign: "center",
          }}
        >
          {centerValue}
        </Text>
      )}
      {centerLabel && (
        <Text
          x={cx}
          y={cy + 12}
          style={{
            fontFamily: f.body,
            fontSize: 8,
            color: c.ink[500],
            textAlign: "center",
          }}
        >
          {centerLabel}
        </Text>
      )}
    </Svg>
  );
}

// ─── 데이터 테이블 ────────────────────────────────
export function DataTable<T>({
  columns,
  rows,
  zebra = true,
}: {
  columns: {
    key: string;
    header: string;
    width?: number | string;
    align?: "left" | "right" | "center";
    accessor: (row: T) => string;
  }[];
  rows: T[];
  zebra?: boolean;
}) {
  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 0.6,
        borderColor: c.ink[200],
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: c.ink[50],
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderBottomWidth: 0.6,
          borderBottomColor: c.ink[200],
        }}
      >
        {columns.map((col) => (
          <Text
            key={col.key}
            style={{
              flex: typeof col.width === "number" ? col.width : 1,
              fontFamily: f.display,
              fontWeight: 700,
              fontSize: 8,
              color: c.ink[600],
              textAlign: col.align || "left",
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {col.header}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            paddingVertical: 7,
            paddingHorizontal: 10,
            backgroundColor: zebra && i % 2 === 1 ? c.ink[50] : c.white,
            borderBottomWidth: i === rows.length - 1 ? 0 : 0.4,
            borderBottomColor: c.ink[100],
          }}
          wrap={false}
        >
          {columns.map((col) => (
            <Text
              key={col.key}
              style={{
                flex: typeof col.width === "number" ? col.width : 1,
                fontFamily: f.body,
                fontSize: 9,
                color: c.ink[800],
                textAlign: col.align || "left",
              }}
            >
              {col.accessor(row)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── 칩 ──────────────────────────────────────────
export function Chip({
  label,
  tone = "brand",
}: {
  label: string;
  tone?: "brand" | "emerald" | "rose" | "amber" | "neutral";
}) {
  const palette =
    tone === "emerald"
      ? { bg: c.emerald[100], fg: c.emerald[700] }
      : tone === "rose"
        ? { bg: c.rose[100], fg: c.rose[600] }
        : tone === "amber"
          ? { bg: c.amber[100], fg: c.amber[600] }
          : tone === "neutral"
            ? { bg: c.ink[100], fg: c.ink[700] }
            : { bg: c.brand[50], fg: c.brand[700] };
  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: 999,
        paddingVertical: 3,
        paddingHorizontal: 9,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 8.5, color: palette.fg }}>
        {label}
      </Text>
    </View>
  );
}

// ─── 본문 카드 (제목 + children) ─────────────────
export function PanelCard({
  title,
  desc,
  children,
  tone = "brand",
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  tone?: "brand" | "emerald" | "rose" | "amber";
}) {
  const toneColor =
    tone === "emerald"
      ? c.emerald[600]
      : tone === "rose"
        ? c.rose[600]
        : tone === "amber"
          ? c.amber[600]
          : c.brand[600];
  return (
    <View
      style={{
        borderRadius: 10,
        borderWidth: 0.6,
        borderColor: c.ink[200],
        padding: 14,
        backgroundColor: c.white,
      }}
      wrap={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <View style={{ width: 4, height: 12, borderRadius: 1, backgroundColor: toneColor }} />
        <Text style={{ fontFamily: f.display, fontWeight: 700, fontSize: 11, color: c.ink[900] }}>
          {title}
        </Text>
      </View>
      {desc && (
        <Text
          style={{
            fontFamily: f.body,
            fontSize: 9,
            color: c.ink[500],
            marginBottom: 10,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </Text>
      )}
      {children}
    </View>
  );
}
