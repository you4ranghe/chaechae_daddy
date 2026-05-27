import type { Metadata } from "next";
import { ModalProvider } from "@/components/ui/alert-modal";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MomsUp — 협찬 콘텐츠 올인원 에이전트",
  description: "인스타그램 협찬 DM 분석부터 콘텐츠 생성까지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
