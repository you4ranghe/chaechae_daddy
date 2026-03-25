import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full bg-gray-50">
      <Sidebar />

      {/* 메인 콘텐츠 영역 — 데스크톱에서는 사이드바 너비만큼 오프셋 */}
      <main className="md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
