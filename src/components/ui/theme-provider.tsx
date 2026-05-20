"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "system" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  isDark: false,
  toggleTheme: () => {},
});

function getSystemDark() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);

  // 초기화 — localStorage에서 저장된 테마 복원
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "dark" || saved === "system") {
      setTheme(saved);
    }
  }, []);

  // 테마 변경 → html 클래스 & isDark 상태 업데이트
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === "dark" || (theme === "system" && getSystemDark());
    root.classList.toggle("dark", dark);
    setIsDark(dark);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 시스템 모드일 때 OS 설정 변경 감지
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
      setIsDark(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "system" ? "dark" : "system"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
