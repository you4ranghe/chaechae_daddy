"use client";

import { Font } from "@react-pdf/renderer";

let registered = false;

export function ensurePdfFontsRegistered() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Pretendard",
    fonts: [
      { src: "/fonts/Pretendard-Regular.otf", fontWeight: 400 },
      { src: "/fonts/Pretendard-Bold.otf", fontWeight: 700 },
    ],
  });

  Font.register({
    family: "NotoSansKR",
    src: "/fonts/NotoSansKR-Regular.otf",
  });

  Font.registerHyphenationCallback((word) => [word]);
}

export const pdfColors = {
  ink: {
    900: "#0F172A",
    800: "#1E293B",
    700: "#334155",
    600: "#475569",
    500: "#64748B",
    400: "#94A3B8",
    300: "#CBD5E1",
    200: "#E2E8F0",
    100: "#F1F5F9",
    50: "#F8FAFC",
  },
  brand: {
    900: "#312E81",
    700: "#4338CA",
    600: "#4F46E5",
    500: "#6366F1",
    400: "#818CF8",
    300: "#A5B4FC",
    100: "#E0E7FF",
    50: "#EEF2FF",
  },
  purple: {
    600: "#9333EA",
    500: "#A855F7",
    100: "#F3E8FF",
  },
  rose: {
    600: "#E11D48",
    500: "#F43F5E",
    100: "#FFE4E6",
  },
  amber: {
    600: "#D97706",
    500: "#F59E0B",
    100: "#FEF3C7",
  },
  emerald: {
    700: "#047857",
    600: "#059669",
    500: "#10B981",
    100: "#D1FAE5",
  },
  cyan: {
    600: "#0891B2",
    100: "#CFFAFE",
  },
  pink: {
    500: "#EC4899",
    100: "#FCE7F3",
  },
  white: "#FFFFFF",
  black: "#000000",
};

export const pdfFonts = {
  display: "Pretendard",
  body: "NotoSansKR",
};

export function formatWon(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "-";
  const date = formatDate(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${hh}:${mm}`;
}
