"use client";

import { useState } from "react";
import type { VatMode, SettlementBreakdown } from "@/lib/settlement/calc";
import type { CompletedSponsorship } from "./calculator-client";

interface DownloadSettlementExcelButtonProps {
  rows: { sp: CompletedSponsorship; settlement: SettlementBreakdown }[];
  totals: {
    gross: number;
    grossPayment: number;
    supplyValue: number;
    vat: number;
    withholdingTax: number;
    agencyDeduction: number;
    netToWallet: number;
  };
  period: "day" | "month" | "year";
  vatMode: VatMode;
  withholding: boolean;
  agencyRate: number;
  handle: string;
}

const PERIOD_LABEL: Record<"day" | "month" | "year", string> = {
  day: "오늘",
  month: "이번 달",
  year: "올해",
};

export function DownloadSettlementExcelButton({
  rows,
  totals,
  period,
  vatMode,
  withholding,
  agencyRate,
  handle,
}: DownloadSettlementExcelButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "CW Agent";
      wb.created = new Date();
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

      // ─── 시트 1: 정산 내역 ──────────────────
      const ws = wb.addWorksheet("정산 내역", {
        properties: { defaultRowHeight: 18 },
        views: [{ state: "frozen", ySplit: 5, showGridLines: false }],
      });

      ws.columns = [
        { key: "date", width: 14 },
        { key: "brand", width: 24 },
        { key: "product", width: 28 },
        { key: "industry", width: 14 },
        { key: "gross", width: 14 },
        { key: "supplyValue", width: 14 },
        { key: "vat", width: 12 },
        { key: "withholding", width: 12 },
        { key: "agency", width: 12 },
        { key: "net", width: 16 },
      ];

      // 타이틀
      ws.mergeCells("A1:J1");
      const title = ws.getCell("A1");
      title.value = `CW Agent 정산 리포트 — ${PERIOD_LABEL[period]}`;
      title.font = { name: "Pretendard", size: 18, bold: true, color: { argb: "FF0F172A" } };
      title.alignment = { vertical: "middle" };
      ws.getRow(1).height = 36;

      // 부제
      ws.mergeCells("A2:J2");
      const sub = ws.getCell("A2");
      sub.value = `${handle}님 · 생성일 ${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} · ${rows.length}건 · 부가세 ${vatMode === "excluded" ? "별도" : vatMode === "included" ? "포함" : "면세"} · 원천세 ${withholding ? "차감" : "없음"} · 수수료 ${(agencyRate * 100).toFixed(1)}%`;
      sub.font = { name: "Pretendard", size: 10, color: { argb: "FF64748B" } };
      ws.getRow(2).height = 22;

      // 컬러 바
      ws.mergeCells("A3:J3");
      const bar = ws.getCell("A3");
      bar.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 0,
        stops: [
          { position: 0, color: { argb: "FF10B981" } },
          { position: 1, color: { argb: "FF14B8A6" } },
        ],
      };
      ws.getRow(3).height = 4;
      ws.getRow(4).height = 8;

      // 헤더
      const headers = [
        "정산일",
        "브랜드",
        "제품",
        "업종",
        "표기금액(원)",
        "공급가액(원)",
        "부가세(원)",
        "원천세(원)",
        "수수료(원)",
        "실수령(원)",
      ];
      const headerRow = ws.getRow(5);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
        cell.font = { name: "Pretendard", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = {
          vertical: "middle",
          horizontal: i >= 4 ? "right" : "left",
        };
        cell.border = { bottom: { style: "thin", color: { argb: "FF334155" } } };
      });
      headerRow.height = 28;

      // 데이터 행
      rows.forEach(({ sp, settlement }, idx) => {
        const row = ws.addRow({
          date: shortDate(sp.created_at),
          brand: sp.brand_name || "-",
          product: sp.product || "-",
          industry: sp.industry || "-",
          gross: sp.payment_amount,
          supplyValue: settlement.supplyValue,
          vat: settlement.vat,
          withholding: settlement.withholdingTax,
          agency: settlement.agencyDeduction,
          net: settlement.netToWallet,
        });
        const isZebra = idx % 2 === 1;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: "Pretendard", size: 10, color: { argb: "FF1E293B" } };
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber >= 5 ? "right" : "left",
          };
          if (isZebra) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
          cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
          if (colNumber >= 5) cell.numFmt = '"₩"#,##0';
        });
        // 실수령액 강조
        const netCell = row.getCell(10);
        netCell.font = {
          name: "Pretendard",
          size: 10,
          bold: true,
          color: { argb: "FF047857" },
        };
        row.height = 22;
      });

      // 합계 행
      const totalRow = ws.getRow(5 + rows.length + 1);
      totalRow.getCell(1).value = "합계";
      totalRow.getCell(1).font = {
        name: "Pretendard",
        size: 11,
        bold: true,
        color: { argb: "FF0F172A" },
      };
      [
        { col: 5, v: totals.gross },
        { col: 6, v: totals.supplyValue },
        { col: 7, v: totals.vat },
        { col: 8, v: totals.withholdingTax },
        { col: 9, v: totals.agencyDeduction },
        { col: 10, v: totals.netToWallet },
      ].forEach(({ col, v }) => {
        const cell = totalRow.getCell(col);
        cell.value = v;
        cell.numFmt = '"₩"#,##0';
        cell.font = {
          name: "Pretendard",
          size: 11,
          bold: true,
          color: { argb: col === 10 ? "FF047857" : "FF0F172A" },
        };
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.border = { top: { style: "medium", color: { argb: "FF10B981" } } };
      });
      totalRow.height = 32;

      // 자동필터
      ws.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: 5 + rows.length, column: 10 },
      };

      // ─── 시트 2: 요약 ──────────────────
      const ws2 = wb.addWorksheet("요약", { views: [{ showGridLines: false }] });
      ws2.columns = [
        { key: "label", width: 24 },
        { key: "value", width: 20 },
      ];

      ws2.mergeCells("A1:B1");
      ws2.getCell("A1").value = `${PERIOD_LABEL[period]} 정산 요약`;
      ws2.getCell("A1").font = { name: "Pretendard", size: 16, bold: true };
      ws2.getRow(1).height = 32;

      const summaryRows: { label: string; value: number; highlight?: boolean }[] = [
        { label: "협찬 건수", value: rows.length },
        { label: "광고주 입금 총액", value: totals.grossPayment },
        { label: "공급가액 합계", value: totals.supplyValue },
        { label: "부가세 합계", value: totals.vat },
        { label: "원천세 합계", value: totals.withholdingTax },
        { label: "매니지먼트 수수료 합계", value: totals.agencyDeduction },
        { label: "실수령액 합계", value: totals.netToWallet, highlight: true },
      ];
      summaryRows.forEach((r, idx) => {
        const row = ws2.getRow(3 + idx);
        row.getCell(1).value = r.label;
        row.getCell(2).value = r.value;
        const isCount = r.label === "협찬 건수";
        row.getCell(2).numFmt = isCount ? "0" : '"₩"#,##0';
        row.getCell(1).font = {
          name: "Pretendard",
          size: 11,
          color: { argb: r.highlight ? "FF047857" : "FF1E293B" },
          bold: r.highlight,
        };
        row.getCell(2).font = {
          name: "Pretendard",
          size: 11,
          color: { argb: r.highlight ? "FF047857" : "FF1E293B" },
          bold: r.highlight,
        };
        row.getCell(1).alignment = { vertical: "middle" };
        row.getCell(2).alignment = { vertical: "middle", horizontal: "right" };
        if (r.highlight) {
          row.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD1FAE5" },
          };
          row.getCell(2).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD1FAE5" },
          };
        }
        row.height = 22;
      });

      // 다운로드
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CW-Agent_정산_${PERIOD_LABEL[period]}_${handle}_${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Excel 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Excel 만드는 중…
        </>
      ) : (
        <>
          <ExcelIcon className="h-4 w-4" />
          정산 내역 Excel 다운로드
          <ArrowDownIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
        </>
      )}
    </button>
  );
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function ExcelIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Zm1.97 11.78a.75.75 0 0 0 1.06-1.06l-1.97-1.97 1.97-1.97a.75.75 0 1 0-1.06-1.06l-2.5 2.5a.75.75 0 0 0 0 1.06l2.5 2.5Zm3.81-3.03a.75.75 0 1 0-1.06 1.06l1.97 1.97-1.97 1.97a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5Z" clipRule="evenodd" />
      <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
    </svg>
  );
}

function ArrowDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  );
}
