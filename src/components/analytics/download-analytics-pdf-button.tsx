"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/ui/alert-modal";
import type { AnalyticsReport } from "@/lib/agents/analytics-agent";

interface DownloadAnalyticsPdfButtonProps {
  report: AnalyticsReport;
  reportDate?: Date;
  size?: "sm" | "md";
}

export function DownloadAnalyticsPdfButton({
  report,
  reportDate,
  size = "md",
}: DownloadAnalyticsPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [handle, setHandle] = useState<string>("사용자");
  const { showAlert } = useModal();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.handle) setHandle(d.handle);
      })
      .catch(() => {});
  }, []);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { AnalyticsReportPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/analytics-report"),
      ]);

      const generatedAt = new Date();
      const blob = await pdf(
        <AnalyticsReportPdf
          report={report}
          handle={handle}
          reportDate={reportDate || generatedAt}
          generatedAt={generatedAt}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = `${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, "0")}${String(generatedAt.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `MomsUp_주간성과_${handle}_${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showAlert({ emoji: "📄", title: "PDF 생성 실패", message: "PDF 생성에 실패했어요.\n잠시 후 다시 시도해주세요.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            생성 중
          </>
        ) : (
          <>
            <DownloadIcon className="h-3.5 w-3.5" />
            PDF 저장
          </>
        )}
      </button>
    );
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
          PDF 만드는 중…
        </>
      ) : (
        <>
          <DownloadIcon className="h-4 w-4" />
          PDF로 저장
        </>
      )}
    </button>
  );
}

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z" clipRule="evenodd" />
    </svg>
  );
}
