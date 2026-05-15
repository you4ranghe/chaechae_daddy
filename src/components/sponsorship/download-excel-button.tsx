"use client";

import { useState } from "react";
import type { Sponsorship } from "@/lib/types/sponsorship";

interface DownloadExcelButtonProps {
  rows: Sponsorship[];
  handle: string;
}

const STATUS_LABEL: Record<Sponsorship["status"], string> = {
  pending: "대기",
  accepted: "진행",
  completed: "완료",
  rejected: "거절",
  analyzing: "분석중",
};

const STATUS_BG: Record<Sponsorship["status"], string> = {
  pending: "FFFEF3C7",
  accepted: "FFE0E7FF",
  completed: "FFD1FAE5",
  rejected: "FFFFE4E6",
  analyzing: "FFF1F5F9",
};

const STATUS_FG: Record<Sponsorship["status"], string> = {
  pending: "FFD97706",
  accepted: "FF4F46E5",
  completed: "FF047857",
  rejected: "FFE11D48",
  analyzing: "FF64748B",
};

export function DownloadSponsorshipsExcelButton({
  rows,
  handle,
}: DownloadExcelButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "CW Agent";
      wb.created = new Date();

      const ws = wb.addWorksheet("협찬 내역", {
        properties: { defaultRowHeight: 18 },
        views: [{ state: "frozen", ySplit: 5, showGridLines: false }],
      });

      ws.columns = [
        { header: "", key: "date", width: 14 },
        { header: "", key: "brand", width: 24 },
        { header: "", key: "product", width: 28 },
        { header: "", key: "industry", width: 14 },
        { header: "", key: "type", width: 10 },
        { header: "", key: "amount", width: 16 },
        { header: "", key: "deadline", width: 14 },
        { header: "", key: "status", width: 12 },
        { header: "", key: "score", width: 9 },
        { header: "", key: "rec", width: 10 },
      ];

      // ─── 헤더 영역 (제목/부제) ───────────────
      ws.mergeCells("A1:J1");
      const titleCell = ws.getCell("A1");
      titleCell.value = "CW Agent 협찬 내역 리포트";
      titleCell.font = { name: "Pretendard", size: 18, bold: true, color: { argb: "FF0F172A" } };
      titleCell.alignment = { vertical: "middle" };
      ws.getRow(1).height = 36;

      ws.mergeCells("A2:J2");
      const subCell = ws.getCell("A2");
      const now = new Date();
      const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
      subCell.value = `${handle}님 · 생성일 ${stamp} · 총 ${rows.length}건`;
      subCell.font = { name: "Pretendard", size: 10, color: { argb: "FF64748B" } };
      ws.getRow(2).height = 22;

      // 행 3: 컬러 바
      ws.mergeCells("A3:J3");
      const barCell = ws.getCell("A3");
      barCell.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 0,
        stops: [
          { position: 0, color: { argb: "FF6366F1" } },
          { position: 1, color: { argb: "FFA855F7" } },
        ],
      };
      ws.getRow(3).height = 4;

      // 행 4: 빈 줄
      ws.getRow(4).height = 8;

      // ─── 컬럼 헤더 (행 5) ─────────────────────
      const headers = [
        "분석일",
        "브랜드",
        "제품",
        "업종",
        "유형",
        "단가(원)",
        "마감",
        "상태",
        "AI 점수",
        "추천",
      ];
      const headerRow = ws.getRow(5);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E293B" },
        };
        cell.font = { name: "Pretendard", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { vertical: "middle", horizontal: i === 5 || i === 8 ? "right" : "left" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF334155" } },
        };
      });
      headerRow.height = 28;

      // ─── 데이터 행 ────────────────────────────
      rows.forEach((row, idx) => {
        const r = ws.addRow({
          date: formatDate(row.created_at),
          brand: row.brand_name || "-",
          product: row.product || "-",
          industry: row.analysis?.brand?.industry || "-",
          type: row.analysis?.conditions?.type || "-",
          amount: row.payment_amount || 0,
          deadline: row.deadline && row.deadline !== "미정" ? formatDate(row.deadline) : "미정",
          status: STATUS_LABEL[row.status],
          score: row.analysis?.score?.value ?? null,
          rec: row.analysis?.score?.recommendation || "-",
        });

        const isZebra = idx % 2 === 1;
        r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: "Pretendard", size: 10, color: { argb: "FF1E293B" } };
          cell.alignment = { vertical: "middle" };
          if (isZebra) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" },
            };
          }
          cell.border = {
            bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
          };
          // 단가 컬럼 우측정렬 + 천단위
          if (colNumber === 6) {
            cell.numFmt = '"₩"#,##0;[Red]"-₩"#,##0;"-"';
            cell.alignment = { vertical: "middle", horizontal: "right" };
          }
          if (colNumber === 9) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            if (typeof cell.value === "number") {
              cell.numFmt = "0.0";
            }
          }
        });

        // 상태 셀 채색
        const statusCell = r.getCell(8);
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: STATUS_BG[row.status] },
        };
        statusCell.font = {
          name: "Pretendard",
          size: 10,
          bold: true,
          color: { argb: STATUS_FG[row.status] },
        };
        statusCell.alignment = { vertical: "middle", horizontal: "center" };

        r.height = 22;
      });

      // ─── 합계 행 ──────────────────────────────
      const completedTotal = rows
        .filter((r) => r.status === "completed")
        .reduce((s, r) => s + (r.payment_amount || 0), 0);
      const totalRowIdx = 5 + rows.length + 1;
      const totalRow = ws.getRow(totalRowIdx);
      totalRow.getCell(5).value = "완료 합계";
      totalRow.getCell(5).font = { name: "Pretendard", size: 10, bold: true, color: { argb: "FF334155" } };
      totalRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
      totalRow.getCell(6).value = completedTotal;
      totalRow.getCell(6).numFmt = '"₩"#,##0';
      totalRow.getCell(6).font = { name: "Pretendard", size: 11, bold: true, color: { argb: "FF4F46E5" } };
      totalRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
      totalRow.height = 28;
      [5, 6].forEach((col) => {
        totalRow.getCell(col).border = {
          top: { style: "medium", color: { argb: "FF4F46E5" } },
        };
      });

      // 자동필터
      ws.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: 5 + rows.length, column: 10 },
      };

      // ─── 두 번째 시트: 월별 요약 ──────────────
      const ws2 = wb.addWorksheet("월별 요약", {
        views: [{ showGridLines: false }],
      });
      ws2.columns = [
        { header: "", key: "month", width: 14 },
        { header: "", key: "count", width: 12 },
        { header: "", key: "completed", width: 12 },
        { header: "", key: "revenue", width: 18 },
      ];

      ws2.mergeCells("A1:D1");
      ws2.getCell("A1").value = "월별 요약";
      ws2.getCell("A1").font = { name: "Pretendard", size: 16, bold: true };
      ws2.getRow(1).height = 32;

      const headers2 = ["월", "전체 협찬", "완료", "완료 수익(원)"];
      const headerRow2 = ws2.getRow(3);
      headers2.forEach((h, i) => {
        const cell = headerRow2.getCell(i + 1);
        cell.value = h;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
        cell.font = { name: "Pretendard", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { vertical: "middle", horizontal: i >= 1 ? "right" : "left" };
      });
      headerRow2.height = 26;

      const monthly = aggregateMonthly(rows);
      monthly.forEach((m, idx) => {
        const r = ws2.addRow(m);
        r.eachCell((cell, colNumber) => {
          cell.font = { name: "Pretendard", size: 10 };
          cell.alignment = { vertical: "middle", horizontal: colNumber >= 2 ? "right" : "left" };
          if (idx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
          if (colNumber === 4) {
            cell.numFmt = '"₩"#,##0';
          }
        });
        r.height = 22;
      });

      // 다운로드
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CW-Agent_협찬내역_${handle}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;
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
      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Zm1.97 11.78a.75.75 0 0 0 1.06-1.06l-1.97-1.97 1.97-1.97a.75.75 0 1 0-1.06-1.06l-2.5 2.5a.75.75 0 0 0 0 1.06l2.5 2.5Zm3.81-3.03a.75.75 0 1 0-1.06 1.06l1.97 1.97-1.97 1.97a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5Z" clipRule="evenodd" />
            <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
          </svg>
          Excel 다운로드
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        </>
      )}
    </button>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function aggregateMonthly(rows: Sponsorship[]) {
  const map = new Map<string, { month: string; count: number; completed: number; revenue: number }>();
  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) || { month: key, count: 0, completed: 0, revenue: 0 };
    existing.count += 1;
    if (row.status === "completed") {
      existing.completed += 1;
      existing.revenue += row.payment_amount || 0;
    }
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
