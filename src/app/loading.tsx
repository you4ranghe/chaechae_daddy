import { BabyLoader } from "@/components/ui/baby-loader";

// 루트 레벨 페이지 전환 시 자동 노출되는 로딩 UI
// 더 구체적인 segment(loading.tsx)가 있으면 그쪽이 우선
export default function RootLoading() {
  return <BabyLoader fullscreen message="잠시만요" />;
}
