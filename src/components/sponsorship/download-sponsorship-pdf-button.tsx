"use client";

import { useState } from "react";
import type { GeneratedContent, Sponsorship } from "@/lib/types/sponsorship";

interface DownloadSponsorshipPdfButtonProps {
  sponsorship: Sponsorship;
  content: GeneratedContent | null;
  handle: string;
}

export function DownloadSponsorshipPdfButton({
  sponsorship,
  content,
  handle,
}: DownloadSponsorshipPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const [{ pdf }, { SponsorshipReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/sponsorship-report"),
      ]);

      const generatedAt = new Date();
      const blob = await pdf(
        <SponsorshipReport
          sponsorship={sponsorship}
          content={content}
          handle={handle}
          generatedAt={generatedAt}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = `${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, "0")}${String(generatedAt.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `CW-Agent_협찬_${sponsorship.brand_name}_${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("PDF 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {loading ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          PDF 만드는 중
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z" clipRule="evenodd" />
          </svg>
          PDF 저장
        </>
      )}
    </button>
  );
}
