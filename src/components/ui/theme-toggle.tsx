"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", systemDark);
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  // 마운트 시 저장된 테마 복원
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(saved);
    applyTheme(saved);

    // 시스템 모드일 때 OS 변경 감지
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") {
        applyTheme("system");
      }
    };
    mql.addEventListener("change", onSystemChange);
    return () => mql.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "system" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "시스템 모드로 전환" : "다크 모드로 전환"}
      title={theme === "dark" ? "시스템 모드" : "다크 모드"}
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition-all hover:bg-gray-100 hover:scale-110 active:scale-95 ${className}`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
