"use client";

import { useState } from "react";
import { useModal } from "@/components/ui/alert-modal";
import type { InsightsData } from "@/lib/db/insights";

interface DownloadPdfButtonProps {
  data: InsightsData;
  handle: string;
}

export function DownloadInsightsPdfButton({ data, handle }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useModal();

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { InsightsReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/insights-report"),
      ]);

      const generatedAt = new Date();
      const blob = await pdf(
        <InsightsReport data={data} handle={handle} generatedAt={generatedAt} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = `${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, "0")}${String(generatedAt.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `MomsUp_인사이트리포트_${handle}_${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed", e);
      showAlert({ emoji: "📄", title: "PDF 생성 실패", message: "PDF 생성에 실패했어요.\n잠시 후 다시 시도해주세요.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          PDF 만드는 중…
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Zm5.61 9.99a.75.75 0 0 0-1.5 0v2.69l-.72-.72a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 1 0-1.06-1.06l-.72.72v-2.69Z" clipRule="evenodd" />
            <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
          </svg>
          PDF 리포트 다운로드
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        </>
      )}
    </button>
  );
}
