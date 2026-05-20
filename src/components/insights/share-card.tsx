"use client";

import { useState } from "react";

interface ShareCardProps {
  completed: number;
  revenue: number;
  acceptRate: number;
  handle: string;
  month: string; // "2026.05"
}

export function ShareCard({
  completed,
  revenue,
  acceptRate,
  handle,
  month,
}: ShareCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "loading" | "done">("idle");
  const [shareStatus, setShareStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams({
    completed: String(completed),
    revenue: String(revenue),
    acceptRate: String(acceptRate),
    handle,
    month,
  });
  const ogUrl = `/api/og/monthly-summary?${params.toString()}`;
  const fileName = `MomsUp_${handle}_${month.replace(".", "")}.png`;

  async function fetchBlob(): Promise<Blob> {
    const res = await fetch(ogUrl);
    if (!res.ok) throw new Error("이미지 생성 실패");
    return res.blob();
  }

  async function handleDownload() {
    if (downloadStatus !== "idle") return;
    setDownloadStatus("loading");
    setError(null);
    try {
      const blob = await fetchBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadStatus("done");
      setTimeout(() => setDownloadStatus("idle"), 2200);
    } catch {
      setError("이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
      setDownloadStatus("idle");
    }
  }

  async function handleShare() {
    if (shareStatus !== "idle") return;
    setShareStatus("loading");
    setError(null);
    try {
      const blob = await fetchBlob();
      const file = new File([blob], fileName, { type: "image/png" });

      const canShareFile =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: `${handle}님의 ${month} 협찬 성과`,
          text: `이번 달 ${completed}건 완료 · MomsUp`,
        });
      } else {
        // 폴백: 다운로드
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setError("이 기기는 공유 시트가 없어서 이미지를 다운로드했어요. 인스타/카톡에 직접 첨부해주세요.");
      }
    } catch (e) {
      // 사용자가 시트 닫은 경우(AbortError) 무시
      if ((e as DOMException)?.name !== "AbortError") {
        setError("공유에 실패했어요.");
      }
    } finally {
      setShareStatus("idle");
    }
  }

  async function handleCopyLink() {
    try {
      const fullUrl = `${window.location.origin}${ogUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2200);
    } catch {
      setError("링크 복사에 실패했어요.");
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
        {/* 미리보기 */}
        <div className="relative flex items-center justify-center bg-gradient-to-br from-pink-900 via-rose-900 to-slate-900 p-6 md:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-pink-500/30 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-pink-500/30 blur-3xl"
          />
          {/* 이미지 자체 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogUrl}
            alt={`${month} 공유 카드 미리보기`}
            className="relative aspect-square w-full max-w-[360px] rounded-2xl shadow-2xl shadow-pink-900/50 ring-1 ring-white/10"
          />
        </div>

        {/* 컨트롤 */}
        <div className="flex flex-col justify-between gap-5 p-6 md:p-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-pink-700 ring-1 ring-inset ring-pink-100">
              <SparkleIcon className="h-3 w-3" />
              공유 카드
            </div>
            <h3 className="mt-2 text-lg font-bold text-gray-900">
              이번 달 성과를 1080×1080 카드로
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
              인스타 피드·스토리, 카톡 프로필 공유에 딱 맞는 정사각형 이미지예요.
              본인 핸들과 워터마크가 들어가 신뢰감을 더해줍니다.
            </p>

            <ul className="mt-4 space-y-2 text-[12.5px] text-gray-600">
              <Bullet>
                완료 <b className="font-bold text-gray-900">{completed}건</b> · 수익{" "}
                <b className="font-bold text-gray-900">{formatWon(revenue)}</b>
              </Bullet>
              <Bullet>
                수락률 <b className="font-bold text-gray-900">{acceptRate}%</b>
              </Bullet>
              <Bullet>
                핸들 <b className="font-bold text-gray-900">@{handle}</b>
              </Bullet>
            </ul>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700 ring-1 ring-inset ring-rose-100">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={shareStatus !== "idle"}
              className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {shareStatus === "loading" ? (
                <Spinner />
              ) : (
                <ShareIcon className="h-4 w-4" />
              )}
              인스타·카톡에 공유
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadStatus === "loading"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {downloadStatus === "loading" ? (
                <Spinner />
              ) : downloadStatus === "done" ? (
                <CheckIcon className="h-4 w-4 text-emerald-500" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}
              {downloadStatus === "done" ? "저장됨" : "PNG 다운로드"}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              {copyStatus === "copied" ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                  링크 복사됨
                </>
              ) : (
                <>
                  <LinkIcon className="h-3.5 w-3.5" />
                  이미지 링크
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatWon(n: number): string {
  if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000_000) return `₩${(n / 10_000_000).toFixed(1)}천만`;
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}백만`;
  if (n >= 10_000) return `₩${Math.round(n / 10_000)}만`;
  return `₩${n.toLocaleString()}`;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />
      <span>{children}</span>
    </li>
  );
}

function ShareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341L6.97 11.146a2.5 2.5 0 1 1 0-3.792l6.733-3.367A2.515 2.515 0 0 1 13 4.5Z" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function LinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037.75.75 0 0 1-.646 1.353 5.25 5.25 0 0 1-1.449-8.45l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.267a.75.75 0 0 1 1-.353 5.25 5.25 0 0 1 1.449 8.45l-4.5 4.5a5.25 5.25 0 1 1-7.424-7.424l1.757-1.757a.75.75 0 1 1 1.06 1.06l-1.757 1.757a3.75 3.75 0 1 0 5.304 5.304l4.5-4.5a3.75 3.75 0 0 0-1.035-6.037.75.75 0 0 1-.354-1Z" clipRule="evenodd" />
    </svg>
  );
}

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
