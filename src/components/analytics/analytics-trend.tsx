"use client";

import { useEffect, useMemo, useState } from "react";

type TrendPoint = {
  id: string;
  createdAt: string;
  overallScore: number;
  engagementRate: number;
};

type Tab = "all" | "day" | "month" | "year";

type ChartPoint = { label: string; value: number };

export function AnalyticsTrend() {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/agent/analytics?mode=trend")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else setItems(d.items ?? []);
      })
      .catch(() => !cancelled && setError("추이를 불러오지 못했습니다."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const periods = useMemo(() => {
    if (tab === "all") return [];
    const set = new Set<string>();
    for (const it of items) set.add(periodKey(it.createdAt, tab));
    return Array.from(set).sort().reverse();
  }, [items, tab]);

  useEffect(() => {
    setHover(null);
    if (tab === "all") {
      setSelected(null);
      return;
    }
    if (periods.length > 0) {
      setSelected((prev) => (prev && periods.includes(prev) ? prev : periods[0]));
    } else {
      setSelected(null);
    }
  }, [tab, periods]);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (items.length === 0) return [];
    if (tab === "all") {
      return items.map((it) => ({
        label: shortDate(new Date(it.createdAt)),
        value: it.overallScore,
      }));
    }
    if (!selected) return [];
    if (tab === "day") {
      const pts = items
        .filter((it) => periodKey(it.createdAt, "day") === selected)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return pts.map((it) => {
        const d = new Date(it.createdAt);
        return {
          label: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
          value: it.overallScore,
        };
      });
    }
    if (tab === "month") {
      const bucket = new Map<number, number[]>();
      for (const it of items) {
        if (periodKey(it.createdAt, "month") !== selected) continue;
        const day = new Date(it.createdAt).getDate();
        const arr = bucket.get(day) ?? [];
        arr.push(it.overallScore);
        bucket.set(day, arr);
      }
      return Array.from(bucket.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([day, scores]) => ({
          label: `${day}일`,
          value: avg(scores),
        }));
    }
    const bucket = new Map<number, number[]>();
    for (const it of items) {
      if (periodKey(it.createdAt, "year") !== selected) continue;
      const m = new Date(it.createdAt).getMonth() + 1;
      const arr = bucket.get(m) ?? [];
      arr.push(it.overallScore);
      bucket.set(m, arr);
    }
    return Array.from(bucket.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([m, scores]) => ({ label: `${m}월`, value: avg(scores) }));
  }, [items, tab, selected]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((p) => p.value);
    return {
      avg: avg(values),
      max: Math.max(...values),
      min: Math.min(...values),
      latest: values[values.length - 1],
      count: values.length,
    };
  }, [chartData]);

  const hoverPoint = hover !== null ? chartData[hover] : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-white p-5 shadow-sm sm:p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/40 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <polyline points="3 17 9 11 13 15 21 7" />
                <polyline points="14 7 21 7 21 14" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-gray-900">성과 추이</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">경쟁력 점수의 변화를 한눈에 살펴보세요</p>
        </div>
        {stats && (
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {hoverPoint ? hoverPoint.label : "최신"}
            </p>
            <p className="text-2xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {Math.round(hoverPoint ? hoverPoint.value : stats.latest)}
              </span>
              <span className="ml-0.5 text-xs font-semibold text-gray-400">점</span>
            </p>
          </div>
        )}
      </div>

      <div className="relative mt-4 inline-flex w-full max-w-xs rounded-xl bg-gray-100 p-1 text-sm font-medium">
        {(["all", "day", "month", "year"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-1.5 transition-all ${
              tab === t
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {tab !== "all" && (
        <div className="relative mt-3">
          {periods.length === 0 ? (
            <p className="text-xs text-gray-400">선택 가능한 {tabUnitLabel(tab)} 데이터가 없어요.</p>
          ) : (
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="flex gap-2 px-1">
                {periods.map((p) => {
                  const active = selected === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelected(p)}
                      className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30"
                          : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-700"
                      }`}
                    >
                      {formatPeriodLabel(p, tab)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative mt-4">
        {loading ? (
          <div className="h-56 animate-pulse rounded-2xl bg-gray-50" />
        ) : error ? (
          <div className="rounded-2xl bg-red-50 px-4 py-6 text-center text-sm text-red-600">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 text-center text-sm text-gray-400">
            {items.length === 0
              ? "아직 분석 기록이 없어요. 첫 분석을 진행해보세요."
              : `선택한 ${tabUnitLabel(tab)}에 데이터가 없어요.`}
          </div>
        ) : (
          <LineChart points={chartData} hover={hover} onHover={setHover} />
        )}
      </div>

      {stats && chartData.length > 0 && (
        <div className="relative mt-4 grid grid-cols-4 gap-2">
          <StatCard label="평균" value={Math.round(stats.avg).toString()} />
          <StatCard label="최고" value={Math.round(stats.max).toString()} tone="up" />
          <StatCard label="최저" value={Math.round(stats.min).toString()} tone="down" />
          <StatCard label="분석" value={`${stats.count}회`} />
        </div>
      )}
    </section>
  );
}

function LineChart({
  points,
  hover,
  onHover,
}: {
  points: ChartPoint[];
  hover: number | null;
  onHover: (i: number | null) => void;
}) {
  const W = 640;
  const H = 220;
  const padL = 34;
  const padR = 14;
  const padT = 14;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = points.length;

  const xs = (i: number) => (n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW);
  const ys = (v: number) => padT + innerH - (Math.min(100, Math.max(0, v)) / 100) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(p.value).toFixed(1)}`)
    .join(" ");
  const areaPath =
    n > 0
      ? `${linePath} L${xs(n - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${xs(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`
      : "";

  const gridLines = [0, 25, 50, 75, 100];
  const showEvery = Math.max(1, Math.ceil(n / 6));

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    if (n === 0) return;
    const i = n === 1 ? 0 : Math.round(((x - padL) / innerW) * (n - 1));
    const clamped = Math.max(0, Math.min(n - 1, i));
    onHover(clamped);
  }

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-56 w-full"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={padL}
              x2={W - padR}
              y1={ys(g)}
              y2={ys(g)}
              stroke="#e5e7eb"
              strokeDasharray="3 4"
            />
            <text x={padL - 6} y={ys(g) + 3} textAnchor="end" fontSize="10" fill="#9ca3af">
              {g}
            </text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill="url(#trend-area)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="url(#trend-line)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {points.map((p, i) => {
          const active = hover === i;
          return (
            <g key={i}>
              <circle
                cx={xs(i)}
                cy={ys(p.value)}
                r={active ? 6 : 4}
                fill="white"
                stroke="#10b981"
                strokeWidth={active ? 3 : 2}
              />
              {active && (
                <circle cx={xs(i)} cy={ys(p.value)} r="11" fill="#10b981" opacity="0.12" />
              )}
            </g>
          );
        })}

        {points.map((p, i) => {
          if (i % showEvery !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              x={xs(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {p.label}
            </text>
          );
        })}

        {hover !== null && points[hover] && (
          <line
            x1={xs(hover)}
            x2={xs(hover)}
            y1={padT}
            y2={padT + innerH}
            stroke="#10b981"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />
        )}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg bg-gray-900/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg"
          style={{
            left: `calc(${((xs(hover) / W) * 100).toFixed(2)}% - 28px)`,
          }}
        >
          <span className="text-emerald-300">{Math.round(points[hover].value)}점</span>
          <span className="ml-1 text-gray-300">· {points[hover].label}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color =
    tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-500" : "text-gray-900";
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-0.5 text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

function tabLabel(t: Tab) {
  return t === "all" ? "전체" : t === "day" ? "일" : t === "month" ? "월" : "년";
}

function tabUnitLabel(t: Tab) {
  return t === "day" ? "날짜" : t === "month" ? "월" : "연도";
}

function periodKey(iso: string, mode: Tab) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  if (mode === "day") return `${y}-${m}-${dd}`;
  if (mode === "month") return `${y}-${m}`;
  return `${y}`;
}

function formatPeriodLabel(p: string, tab: Tab) {
  if (tab === "day") {
    const [y, m, d] = p.split("-");
    return `${y}.${m}.${d}`;
  }
  if (tab === "month") {
    const [y, m] = p.split("-");
    return `${y}년 ${Number(m)}월`;
  }
  return `${p}년`;
}

function shortDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
