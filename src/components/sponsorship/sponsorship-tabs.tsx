"use client";

import { useState } from "react";
import type { Sponsorship } from "@/lib/types/sponsorship";
import { NewAnalysisTab } from "./new-analysis-tab";
import { InProgressTab } from "./in-progress-tab";
import { CompletedTab } from "./completed-tab";

const TABS = [
  { id: "new", label: "새 협찬 분석" },
  { id: "progress", label: "진행 중" },
  { id: "completed", label: "완료됨" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SponsorshipTabsProps {
  inProgress: Sponsorship[];
  completed: Sponsorship[];
}

export function SponsorshipTabs({ inProgress, completed }: SponsorshipTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("new");

  return (
    <div>
      {/* 탭 헤더 */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map(function (tab) {
          const isActive = activeTab === tab.id;
          // 진행 중 / 완료 카운트 뱃지
          let count: number | null = null;
          if (tab.id === "progress" && inProgress.length > 0) {
            count = inProgress.length;
          }
          if (tab.id === "completed" && completed.length > 0) {
            count = completed.length;
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {count !== null && (
                <span className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                  isActive
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="mt-5">
        {activeTab === "new" && <NewAnalysisTab />}
        {activeTab === "progress" && <InProgressTab sponsorships={inProgress} />}
        {activeTab === "completed" && <CompletedTab sponsorships={completed} />}
      </div>
    </div>
  );
}
