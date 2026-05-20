import { BabyLoader } from "@/components/ui/baby-loader";

// 대시보드 영역(/dashboard/**) 페이지 전환 시 자동 노출되는 로딩 UI
// (하위 경로에 자체 loading.tsx 가 있으면 그쪽이 우선)
export default function DashboardLoading() {
  return <BabyLoader fullscreen message="대시보드를 준비하고 있어요" />;
}
