"use client";

import { useState } from "react";

interface PlatformLauncherProps {
  caption: string;
  hashtags: string[];
  brandName?: string;
}

type PlatformId =
  | "instagram"
  | "threads"
  | "naver"
  | "facebook"
  | "x"
  | "youtube"
  | "tiktok";

interface Platform {
  id: PlatformId;
  label: string;
  hint: string;
  buildUrl: (params: { caption: string; hashtags: string; isMobile: boolean }) => string;
  icon: (props: { className?: string }) => React.JSX.Element;
  tileClass: string;
  iconClass: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "instagram",
    label: "인스타그램",
    hint: "캡션·해시태그 복사 후 작성창",
    buildUrl: ({ isMobile }) =>
      isMobile ? "instagram://camera" : "https://www.instagram.com/",
    icon: InstagramIcon,
    tileClass:
      "bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 text-white",
    iconClass: "text-white",
  },
  {
    id: "threads",
    label: "스레드",
    hint: "캡션 자동 입력",
    buildUrl: ({ caption }) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(caption)}`,
    icon: ThreadsIcon,
    tileClass: "bg-gray-900 text-white",
    iconClass: "text-white",
  },
  {
    id: "naver",
    label: "네이버 블로그",
    hint: "글쓰기 창 바로 열기",
    buildUrl: () => "https://blog.naver.com/PostWriteForm.naver",
    icon: NaverIcon,
    tileClass: "bg-[#03C75A] text-white",
    iconClass: "text-white",
  },
  {
    id: "facebook",
    label: "페이스북",
    hint: "새 게시물 작성",
    buildUrl: () => "https://www.facebook.com/",
    icon: FacebookIcon,
    tileClass: "bg-[#1877F2] text-white",
    iconClass: "text-white",
  },
  {
    id: "x",
    label: "X (트위터)",
    hint: "본문 자동 입력",
    buildUrl: ({ caption }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`,
    icon: XIcon,
    tileClass: "bg-black text-white",
    iconClass: "text-white",
  },
  {
    id: "youtube",
    label: "유튜브",
    hint: "스튜디오 업로드",
    buildUrl: () => "https://studio.youtube.com/",
    icon: YouTubeIcon,
    tileClass: "bg-[#FF0000] text-white",
    iconClass: "text-white",
  },
  {
    id: "tiktok",
    label: "틱톡",
    hint: "업로드 페이지",
    buildUrl: ({ isMobile }) =>
      isMobile ? "https://www.tiktok.com/" : "https://www.tiktok.com/upload",
    icon: TikTokIcon,
    tileClass: "bg-gray-900 text-white",
    iconClass: "text-white",
  },
];

export function PlatformLauncher({
  caption,
  hashtags,
  brandName,
}: PlatformLauncherProps) {
  const [activeId, setActiveId] = useState<PlatformId | null>(null);

  const hashtagText = hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
  const combinedText = hashtagText
    ? `${caption}\n\n${hashtagText}`
    : caption;

  async function handleLaunch(platform: Platform) {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    try {
      await navigator.clipboard.writeText(combinedText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = combinedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setActiveId(platform.id);
    setTimeout(() => setActiveId((curr) => (curr === platform.id ? null : curr)), 2200);

    const url = platform.buildUrl({
      caption: combinedText,
      hashtags: hashtagText,
      isMobile,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-pink-50/50 via-rose-50/40 to-pink-50/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm">
            <RocketIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              포스팅하러 가기
            </h3>
            <p className="text-[10.5px] text-gray-500">
              아이콘을 누르면 캡션·해시태그를 복사하고 작성창을 열어드려요
            </p>
          </div>
        </div>
        {activeId && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckIcon className="h-3 w-3" />
            복사됨 · 새창
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
          {PLATFORMS.map((p) => {
            const isActive = activeId === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleLaunch(p)}
                aria-label={`${p.label}에 포스팅`}
                title={`${p.label} — ${p.hint}`}
                className={`group relative flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${p.tileClass}`}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl bg-white/0 transition-colors group-hover:bg-white/10"
                />
                <Icon className={`h-6 w-6 ${p.iconClass}`} />
                <span className="relative text-[10px] font-semibold tracking-tight">
                  {p.label}
                </span>
                {isActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white"
                  >
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50/70 px-3 py-2.5 ring-1 ring-inset ring-amber-100">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
          <p className="text-[11.5px] leading-relaxed text-amber-800">
            인스타그램은 작성창 URL을 제공하지 않아 메인 화면이 열려요. 모바일은 카메라가 자동으로 열립니다.
            {brandName && (
              <>
                {" "}
                <span className="font-semibold">{brandName}</span> 협찬 표기를 잊지 마세요.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── 아이콘 ────────────────────────────────

function RocketIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
      <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
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

function InfoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442 1.146-2.034a.75.75 0 0 1 1.302.736l-1.014 1.798c.354.07.683.16.978.286.823.357 1.432.96 1.432 1.906 0 .896-.516 1.499-1.19 1.78-.291.121-.628.21-.996.262-.21.03-.434.052-.654.066V16.5a.75.75 0 0 1-1.5 0v-1.05c-.22-.014-.444-.036-.654-.066a4.815 4.815 0 0 1-.996-.262C8.516 14.84 8 14.237 8 13.34c0-.503.245-.949.624-1.272-.41-.087-.815-.215-1.186-.392-.737-.353-1.262-.86-1.262-1.62 0-.751.518-1.247 1.227-1.539.348-.142.74-.24 1.152-.302.246-.037.503-.063.764-.078V6.75a.75.75 0 0 1 1.5 0v.918Z" clipRule="evenodd" />
    </svg>
  );
}

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.27.83-.39.39-.63.76-.83 1.27-.15.39-.33.97-.38 2.04C2.69 9.5 2.68 9.85 2.68 13s.01 3.5.07 4.74c.05 1.07.23 1.65.38 2.04.2.51.44.88.83 1.27.39.39.76.63 1.27.83.39.15.97.33 2.04.38 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.27-.83.39-.39.63-.76.83-1.27.15-.39.33-.97.38-2.04.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.07-.23-1.65-.38-2.04a3.42 3.42 0 0 0-.83-1.27 3.42 3.42 0 0 0-1.27-.83c-.39-.15-.97-.33-2.04-.38C15.5 4.01 15.15 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-2.04a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"/>
    </svg>
  );
}

function ThreadsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.7 11.16c-.08-.04-.16-.07-.25-.11-.14-2.6-1.56-4.1-3.94-4.11h-.04c-1.43 0-2.61.61-3.34 1.71l1.32.9c.55-.83 1.41-1.01 2.03-1.01h.03c.77 0 1.36.23 1.75.67.28.32.47.77.56 1.34a9.34 9.34 0 0 0-2.21-.1c-2.23.13-3.67 1.43-3.57 3.24.05.92.51 1.71 1.29 2.23.66.44 1.51.65 2.39.6 1.17-.06 2.08-.51 2.72-1.32.48-.62.79-1.42.92-2.43.55.33.96.77 1.18 1.3.39.9.41 2.38-.8 3.59-1.06 1.06-2.33 1.51-4.27 1.53-2.14-.02-3.76-.7-4.83-2.04-1-1.24-1.51-3.04-1.53-5.34.02-2.3.53-4.1 1.53-5.34C8.71 5.16 10.33 4.48 12.47 4.46c2.15.02 3.81.7 4.92 2.04.55.66.96 1.49 1.23 2.45l1.55-.41c-.33-1.18-.85-2.21-1.55-3.06-1.43-1.72-3.52-2.6-6.21-2.62h-.02c-2.68.02-4.74.91-6.13 2.63C5.04 7.07 4.41 9.31 4.39 12v.01c.02 2.7.66 4.93 1.91 6.5 1.39 1.72 3.45 2.6 6.13 2.63h.02c2.38-.02 4.06-.65 5.45-2.04 1.81-1.81 1.75-4.07 1.16-5.46-.43-1-1.25-1.81-2.36-2.34zm-3.74 2.92c-.96.05-1.96-.39-2.01-1.32-.03-.69.5-1.46 2.07-1.55h.42c.65 0 1.26.07 1.81.19-.21 2.5-1.39 2.63-2.29 2.68z"/>
    </svg>
  );
}

function NaverIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 4h4.36L14.5 12.6V4H19v16h-4.36L9.5 11.4V20H5V4Z"/>
    </svg>
  );
}

function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5 3.66 9.15 8.44 9.93v-7.02H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.77l-.44 2.91h-2.33V22c4.78-.78 8.44-4.93 8.44-9.93Z"/>
    </svg>
  );
}

function XIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.53 3H20.5l-6.5 7.43L21.5 21h-5.97l-4.67-6.11L5.5 21H2.5l6.95-7.94L2.5 3h6.12l4.22 5.58L17.53 3Zm-1.05 16.2h1.65L7.6 4.7H5.83L16.48 19.2Z"/>
    </svg>
  );
}

function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.5 7.2a3.02 3.02 0 0 0-2.13-2.14C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.37.56A3.02 3.02 0 0 0 .5 7.2C0 9.07 0 12 0 12s0 2.93.5 4.8a3.02 3.02 0 0 0 2.13 2.14C4.5 19.5 12 19.5 12 19.5s7.5 0 9.37-.56a3.02 3.02 0 0 0 2.13-2.14c.5-1.87.5-4.8.5-4.8s0-2.93-.5-4.8ZM9.6 15.5v-7l6.27 3.5L9.6 15.5Z"/>
    </svg>
  );
}

function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.6 5.82c-.91-.6-1.55-1.55-1.78-2.65a4.7 4.7 0 0 1-.08-.84h-3.16v12.62a2.85 2.85 0 0 1-2.85 2.85 2.85 2.85 0 1 1 .9-5.56v-3.21a6.04 6.04 0 0 0-.9-.07A6.07 6.07 0 1 0 14.8 15v-6.4a7.7 7.7 0 0 0 4.5 1.44V6.88a4.55 4.55 0 0 1-2.7-1.06Z"/>
    </svg>
  );
}
