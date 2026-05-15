"use client";

import { useMemo, useState } from "react";
import {
  calcSettlement,
  calcAnnualTax,
  formatWon,
  type VatMode,
} from "@/lib/settlement/calc";
import { DownloadSettlementExcelButton } from "./download-settlement-excel";

export interface CompletedSponsorship {
  id: string;
  brand_name: string;
  product: string | null;
  payment_amount: number;
  created_at: string;
  industry: string | null;
}

interface CalculatorClientProps {
  completed: CompletedSponsorship[];
  handle: string;
}

type Mode = "auto" | "manual";
type Period = "day" | "month" | "year";

export function CalculatorClient({ completed, handle }: CalculatorClientProps) {
  const [mode, setMode] = useState<Mode>(completed.length > 0 ? "auto" : "manual");
  const [period, setPeriod] = useState<Period>("month");
  const [vatMode, setVatMode] = useState<VatMode>("excluded");
  const [withholding, setWithholding] = useState(true);
  const [agencyFee, setAgencyFee] = useState("0");
  const [otherIncome, setOtherIncome] = useState("0");
  const [manualGross, setManualGross] = useState("1000000");

  const agencyRate = Math.max(0, Math.min(100, Number(agencyFee) || 0)) / 100;
  const otherIncomeNum = Math.max(0, Number(otherIncome) || 0);

  // ─── 자동 모드: 기간 필터링된 협찬 + 각각 정산 + 합산 ───────
  const autoData = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    if (period === "day") {
      from.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
    } else {
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
    }

    const filtered = completed.filter((sp) => {
      const d = new Date(sp.created_at);
      return d.getTime() >= from.getTime() && d.getTime() <= now.getTime();
    });

    const rows = filtered.map((sp) => {
      const settlement = calcSettlement({
        gross: sp.payment_amount,
        vatMode,
        withholding,
        agencyRate,
      });
      return { sp, settlement };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        gross: acc.gross + r.sp.payment_amount,
        grossPayment: acc.grossPayment + r.settlement.grossPayment,
        supplyValue: acc.supplyValue + r.settlement.supplyValue,
        vat: acc.vat + r.settlement.vat,
        withholdingTax: acc.withholdingTax + r.settlement.withholdingTax,
        agencyDeduction: acc.agencyDeduction + r.settlement.agencyDeduction,
        netToWallet: acc.netToWallet + r.settlement.netToWallet,
      }),
      {
        gross: 0,
        grossPayment: 0,
        supplyValue: 0,
        vat: 0,
        withholdingTax: 0,
        agencyDeduction: 0,
        netToWallet: 0,
      },
    );

    return { rows, totals, fromDate: from };
  }, [completed, period, vatMode, withholding, agencyRate]);

  // ─── 수동 모드: 단일 입력 ────────────────────────────────
  const manualData = useMemo(() => {
    const gross = Math.max(0, Number(manualGross) || 0);
    const settlement = calcSettlement({ gross, vatMode, withholding, agencyRate });
    return { gross, settlement };
  }, [manualGross, vatMode, withholding, agencyRate]);

  // 결과 (모드에 따라 다른 데이터로 종소세 추산)
  const activeSupply =
    mode === "auto" ? autoData.totals.supplyValue : manualData.settlement.supplyValue;
  const activeWithholding =
    mode === "auto" ? autoData.totals.withholdingTax : manualData.settlement.withholdingTax;
  const activeNet =
    mode === "auto" ? autoData.totals.netToWallet : manualData.settlement.netToWallet;
  const activeVat = mode === "auto" ? autoData.totals.vat : manualData.settlement.vat;
  const activeAgency =
    mode === "auto" ? autoData.totals.agencyDeduction : manualData.settlement.agencyDeduction;
  const activeGrossPayment =
    mode === "auto" ? autoData.totals.grossPayment : manualData.settlement.grossPayment;

  const annualTax = useMemo(
    () =>
      calcAnnualTax({
        annualSupplyValue: activeSupply,
        otherBusinessIncome: otherIncomeNum,
        withholdingTotal: activeWithholding,
      }),
    [activeSupply, otherIncomeNum, activeWithholding],
  );

  return (
    <div className="space-y-5">
      {/* 모드 + 기간 탭 */}
      <section className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1">
          {/* 모드 토글 */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <ModeTab
              active={mode === "auto"}
              onClick={() => setMode("auto")}
              label="자동"
              hint={`완료 협찬 ${completed.length}건`}
              disabled={completed.length === 0}
            />
            <ModeTab
              active={mode === "manual"}
              onClick={() => setMode("manual")}
              label="수동 시뮬레이션"
            />
          </div>

          {/* 기간 탭 — 자동 모드에서만 */}
          {mode === "auto" && (
            <div className="inline-flex rounded-xl bg-emerald-50 p-1 ring-1 ring-inset ring-emerald-100">
              {(["day", "month", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    period === p
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-emerald-600/70 hover:text-emerald-700"
                  }`}
                >
                  {p === "day" ? "오늘" : p === "month" ? "이번 달" : "올해"}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* ── 좌측: 입력 / 협찬 리스트 ─────────────── */}
        {mode === "auto" ? (
          <AutoModeInputs
            rows={autoData.rows}
            period={period}
            vatMode={vatMode}
            setVatMode={setVatMode}
            withholding={withholding}
            setWithholding={setWithholding}
            agencyFee={agencyFee}
            setAgencyFee={setAgencyFee}
            otherIncome={otherIncome}
            setOtherIncome={setOtherIncome}
          />
        ) : (
          <ManualModeInputs
            manualGross={manualGross}
            setManualGross={setManualGross}
            vatMode={vatMode}
            setVatMode={setVatMode}
            withholding={withholding}
            setWithholding={setWithholding}
            agencyFee={agencyFee}
            setAgencyFee={setAgencyFee}
            otherIncome={otherIncome}
            setOtherIncome={setOtherIncome}
          />
        )}

        {/* ── 우측: 결과 ─────────────────────────── */}
        <section className="space-y-4">
          <ResultHero
            label={
              mode === "auto"
                ? `${period === "day" ? "오늘" : period === "month" ? "이번 달" : "올해"} 실수령액`
                : "실수령액 (호주머니로 들어오는 돈)"
            }
            value={activeNet}
            supplyValue={activeSupply}
            withholdingTax={activeWithholding}
            agencyDeduction={activeAgency}
            count={mode === "auto" ? autoData.rows.length : null}
          />

          <FlowCard
            grossPayment={activeGrossPayment}
            supplyValue={activeSupply}
            vat={activeVat}
            vatMode={vatMode}
            withholdingTax={activeWithholding}
            agencyDeduction={activeAgency}
            netToWallet={activeNet}
          />

          <AnnualTaxCard tax={annualTax} />

          {mode === "auto" && autoData.rows.length > 0 && (
            <DownloadSettlementExcelButton
              rows={autoData.rows}
              totals={autoData.totals}
              period={period}
              vatMode={vatMode}
              withholding={withholding}
              agencyRate={agencyRate}
              handle={handle}
            />
          )}

          <Disclaimer />
        </section>
      </div>
    </div>
  );
}

// ─── 모드 탭 ──────────────────────────────────
function ModeTab({
  active,
  onClick,
  label,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {label}
      {hint && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            active ? "bg-emerald-50 text-emerald-700" : "bg-gray-200/70 text-gray-500"
          }`}
        >
          {hint}
        </span>
      )}
    </button>
  );
}

// ─── 자동 모드 입력 ────────────────────────────
function AutoModeInputs({
  rows,
  period,
  vatMode,
  setVatMode,
  withholding,
  setWithholding,
  agencyFee,
  setAgencyFee,
  otherIncome,
  setOtherIncome,
}: {
  rows: { sp: CompletedSponsorship; settlement: ReturnType<typeof calcSettlement> }[];
  period: Period;
  vatMode: VatMode;
  setVatMode: (v: VatMode) => void;
  withholding: boolean;
  setWithholding: (v: boolean) => void;
  agencyFee: string;
  setAgencyFee: (v: string) => void;
  otherIncome: string;
  setOtherIncome: (v: string) => void;
}) {
  return (
    <section className="space-y-4">
      {/* 정산 규칙 */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <SlidersIcon className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold text-gray-900">정산 규칙</h2>
          <span className="ml-auto text-[11px] font-medium text-gray-400">
            {rows.length}건 일괄 적용
          </span>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="부가세 처리">
            <div className="grid grid-cols-3 gap-2">
              <SegBtn active={vatMode === "excluded"} onClick={() => setVatMode("excluded")} label="별도 (+10%)" />
              <SegBtn active={vatMode === "included"} onClick={() => setVatMode("included")} label="포함" />
              <SegBtn active={vatMode === "none"} onClick={() => setVatMode("none")} label="면세" />
            </div>
          </Field>
          <Field label="원천징수 3.3%" hint="광고주가 차감 후 입금하는지">
            <div className="flex gap-2">
              <SegBtn active={withholding} onClick={() => setWithholding(true)} label="차감" />
              <SegBtn active={!withholding} onClick={() => setWithholding(false)} label="없음" />
            </div>
          </Field>
          <Field label="매니지먼트 수수료 (%)" hint="없으면 0">
            <NumberInput value={agencyFee} onChange={setAgencyFee} suffix="%" step="0.1" />
            <div className="mt-2 flex gap-1.5">
              {[0, 15, 20, 25, 30].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAgencyFee(String(v))}
                  className={`flex-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                    Number(agencyFee) === v
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </Field>
          <Field label="이 외 연 사업소득" hint="종합소득세 추산용. 모르면 0">
            <NumberInput value={otherIncome} onChange={setOtherIncome} suffix="원" />
          </Field>
        </div>
      </div>

      {/* 협찬 리스트 */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <ListIcon className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-gray-900">
              {period === "day" ? "오늘" : period === "month" ? "이번 달" : "올해"} 완료 협찬
            </h2>
            <span className="ml-auto text-[11px] font-medium text-gray-400">
              {rows.length}건
            </span>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-400">
              이 기간에 완료된 협찬이 없어요
            </p>
          </div>
        ) : (
          <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
            {rows.map(({ sp, settlement }) => (
              <div key={sp.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{sp.brand_name}</p>
                  <p className="truncate text-[11px] text-gray-500">
                    {formatShortDate(sp.created_at)}
                    {sp.product && ` · ${sp.product}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-emerald-700">
                    {formatWon(settlement.netToWallet)}
                  </p>
                  <p className="text-[10px] text-gray-400 tabular-nums">
                    {formatWon(sp.payment_amount)} 원래
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── 수동 모드 입력 ────────────────────────────
function ManualModeInputs({
  manualGross,
  setManualGross,
  vatMode,
  setVatMode,
  withholding,
  setWithholding,
  agencyFee,
  setAgencyFee,
  otherIncome,
  setOtherIncome,
}: {
  manualGross: string;
  setManualGross: (v: string) => void;
  vatMode: VatMode;
  setVatMode: (v: VatMode) => void;
  withholding: boolean;
  setWithholding: (v: boolean) => void;
  agencyFee: string;
  setAgencyFee: (v: string) => void;
  otherIncome: string;
  setOtherIncome: (v: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <PencilIcon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold text-gray-900">협찬 조건 입력</h2>
      </div>

      <div className="mt-5 space-y-5">
        <Field
          label="협찬료"
          hint={
            vatMode === "included"
              ? "표기에 부가세 포함"
              : vatMode === "excluded"
                ? "표기 외 부가세 별도"
                : "면세/미사업자"
          }
        >
          <NumberInput value={manualGross} onChange={setManualGross} suffix="원" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setManualGross(String(v))}
                className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                {v >= 1_000_000 ? `${v / 1_000_000}백만` : `${v / 10_000}만`}
              </button>
            ))}
          </div>
        </Field>

        <Field label="부가세 처리">
          <div className="grid grid-cols-3 gap-2">
            <SegBtn active={vatMode === "excluded"} onClick={() => setVatMode("excluded")} label="별도 (+10%)" />
            <SegBtn active={vatMode === "included"} onClick={() => setVatMode("included")} label="포함" />
            <SegBtn active={vatMode === "none"} onClick={() => setVatMode("none")} label="면세" />
          </div>
        </Field>

        <Field label="원천징수 3.3%" hint="광고주가 차감 후 입금하는지">
          <div className="flex gap-2">
            <SegBtn active={withholding} onClick={() => setWithholding(true)} label="차감" />
            <SegBtn active={!withholding} onClick={() => setWithholding(false)} label="없음" />
          </div>
        </Field>

        <Field label="매니지먼트 수수료 (%)" hint="없으면 0">
          <NumberInput value={agencyFee} onChange={setAgencyFee} suffix="%" step="0.1" />
          <div className="mt-2 flex gap-1.5">
            {[0, 15, 20, 25, 30].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAgencyFee(String(v))}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                  Number(agencyFee) === v
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </Field>

        <Field label="이 외 연 사업소득" hint="종합소득세 추산용">
          <NumberInput value={otherIncome} onChange={setOtherIncome} suffix="원" />
        </Field>
      </div>
    </section>
  );
}

// ─── 결과 컴포넌트 ─────────────────────────────
function ResultHero({
  label,
  value,
  supplyValue,
  withholdingTax,
  agencyDeduction,
  count,
}: {
  label: string;
  value: number;
  supplyValue: number;
  withholdingTax: number;
  agencyDeduction: number;
  count: number | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20">
      <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <span aria-hidden className="absolute -bottom-10 right-12 h-20 w-20 rounded-full bg-teal-300/30 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">{label}</p>
          {count !== null && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              {count}건 합산
            </span>
          )}
        </div>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatWon(value)}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-emerald-100">
          공급가액 {formatWon(supplyValue)} − 원천세 {formatWon(withholdingTax)} − 매니지먼트{" "}
          {formatWon(agencyDeduction)}
        </p>
      </div>
    </div>
  );
}

function FlowCard({
  grossPayment,
  supplyValue,
  vat,
  vatMode,
  withholdingTax,
  agencyDeduction,
  netToWallet,
}: {
  grossPayment: number;
  supplyValue: number;
  vat: number;
  vatMode: VatMode;
  withholdingTax: number;
  agencyDeduction: number;
  netToWallet: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-bold text-gray-900">정산 흐름</h3>
      <div className="mt-4 space-y-2 text-sm">
        <FlowRow label="광고주 입금" value={formatWon(grossPayment)} bold />
        {vat > 0 && (
          <FlowRow
            label={vatMode === "included" ? "→ 부가세 분리 (포함)" : "→ 부가세 (별도)"}
            value={formatWon(vat)}
            muted
            indent
          />
        )}
        <FlowRow label="공급가액" value={formatWon(supplyValue)} />
        <FlowRow label="원천세 3.3% 차감" value={`− ${formatWon(withholdingTax)}`} negative indent />
        {agencyDeduction > 0 && (
          <FlowRow label="매니지먼트 수수료 차감" value={`− ${formatWon(agencyDeduction)}`} negative indent />
        )}
        <div className="my-2 h-px bg-gray-100" />
        <FlowRow label="실수령액" value={formatWon(netToWallet)} bold highlight />
      </div>
      {vat > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[11.5px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-100">
          부가세 {formatWon(vat)}은 잠시 보관해두는 돈이에요. 다음 부가세 신고 시 납부해야 해요.
        </p>
      )}
    </div>
  );
}

function AnnualTaxCard({ tax }: { tax: ReturnType<typeof calcAnnualTax> }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">연 종합소득세 추산</h3>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
          참고치
        </span>
      </div>
      <p className="mt-1 text-[11.5px] text-gray-500">
        단순경비율 30% 가정 · 실제는 업종별 경비율 / 장부신고에 따라 달라져요
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBlock label="연 사업소득" value={formatWon(tax.annualBusinessIncome)} />
        <StatBlock label="추정 경비" value={`− ${formatWon(tax.estimatedExpense)}`} />
        <StatBlock label="과세표준" value={formatWon(tax.taxableIncome)} />
        <StatBlock label="소득세" value={formatWon(tax.incomeTax)} />
        <StatBlock label="지방세 10%" value={formatWon(tax.localTax)} />
        <StatBlock label="합산 세금" value={formatWon(tax.totalAnnualTax)} tone="brand" />
      </div>
      <div className="mt-4 rounded-lg bg-gray-50 p-3 ring-1 ring-inset ring-gray-100">
        {tax.taxDifference > 0 ? (
          <p className="text-[12.5px] leading-relaxed text-gray-700">
            연 환산 시 원천세보다{" "}
            <b className="font-bold text-rose-600">{formatWon(tax.taxDifference)}</b> 추가 납부해야 할 수 있어요. 5월 종합소득세 신고 때 확인하세요.
          </p>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-gray-700">
            연 환산 시 원천징수액이 더 커서{" "}
            <b className="font-bold text-emerald-600">{formatWon(-tax.taxDifference)}</b> 환급 가능성이 있어요.
          </p>
        )}
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-4 text-[11px] leading-relaxed text-gray-500">
      본 계산은 인적용역 사업소득 기준 단순 추산이에요. 종소세 신고는 업종별 경비율·기장의무·세액공제 등 변수가 많아 실제 금액과 차이가 생길 수 있어요. 정확한 신고는 세무사와 상담을 권해요.
    </div>
  );
}

// ─── 보조 컴포넌트 ─────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-gray-700">
        {label}
        {hint && <span className="text-[10.5px] font-medium text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  suffix,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  step?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={0}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-12 text-sm tabular-nums text-gray-900 outline-none transition-colors focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
        {suffix}
      </span>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
        active
          ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function FlowRow({
  label,
  value,
  bold,
  negative,
  muted,
  highlight,
  indent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
  muted?: boolean;
  highlight?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${indent ? "pl-3" : ""}`}>
      <span
        className={`text-[12.5px] ${
          muted ? "text-gray-400" : negative ? "text-rose-600" : bold ? "font-bold text-gray-900" : "text-gray-600"
        }`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          highlight
            ? "text-base font-bold text-emerald-700"
            : negative
              ? "text-[12.5px] font-bold text-rose-600"
              : bold
                ? "text-sm font-bold text-gray-900"
                : "text-[12.5px] font-semibold text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatBlock({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div
      className={`rounded-xl p-3 ${
        tone === "brand"
          ? "bg-indigo-50 ring-1 ring-inset ring-indigo-100"
          : "bg-gray-50"
      }`}
    >
      <p className="text-[10.5px] font-medium text-gray-500">{label}</p>
      <p
        className={`mt-0.5 text-sm font-bold tabular-nums ${
          tone === "brand" ? "text-indigo-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ─── 아이콘 ────────────────────────────────────
function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );
}

function SlidersIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6 2.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 6 2.25Zm12 0a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6 13.5A2.25 2.25 0 1 0 6 18a2.25 2.25 0 0 0 0-4.5Zm.75-9.75v.75a.75.75 0 0 0 1.5 0V3.75A.75.75 0 0 0 6.75 3Zm5.25 10.5A2.25 2.25 0 1 0 12 18a2.25 2.25 0 0 0 0-4.5Zm5.25-3A2.25 2.25 0 1 0 18 15a2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
    </svg>
  );
}

function ListIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}
