import { CopyButton } from "@/components/sponsorship/copy-button";
import type { HashtagAnalysisResult } from "@/lib/agents/hashtag-agent";

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  large: { label: "대형", color: "bg-red-100 text-red-700" },
  medium: { label: "중형", color: "bg-amber-100 text-amber-700" },
  niche: { label: "니치", color: "bg-emerald-100 text-emerald-700" },
};

export function HashtagAnalysisView({ result }: { result: HashtagAnalysisResult }) {
  const allTags = result.recommendations.map((r) => r.tag).join(" ");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-700 leading-relaxed">{result.strategy}</p>
      </div>

      <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-pink-900">추천 해시태그 ({result.recommendations.length}개)</h4>
          <CopyButton text={allTags} label="전체 복사" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.recommendations.map((r, i) => (
            <span key={i} className={`rounded-full px-2.5 py-1 text-xs font-medium ${TIER_LABELS[r.tier]?.color || "bg-gray-100 text-gray-600"}`}>
              {r.tag}
            </span>
          ))}
        </div>
      </div>

      {(["large", "medium", "niche"] as const).map((tier) => {
        const tags = result.recommendations.filter((r) => r.tier === tier);
        if (tags.length === 0) return null;
        const info = TIER_LABELS[tier];
        return (
          <div key={tier} className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-gray-700">{info.label} 해시태그 ({tags.length}개)</h4>
            <div className="mt-3 space-y-2">
              {tags.map((t, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{t.tag}</span>
                    <p className="text-xs text-gray-500">{t.reason}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{t.estimatedPosts}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-sm font-medium text-gray-500">사용 팁</h4>
        <ul className="mt-2 space-y-1.5">
          {result.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-pink-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
