import { BabyLoader } from "@/components/ui/baby-loader";

// 대시보드 영역(/dashboard/**) 페이지 전환 시 자동 노출되는 로딩 UI
export default function DashboardLoading() {
  return <BabyLoader fullscreen message="잠시만요, 정리하고 있어요" />;
}
