"use client";

import { useState } from "react";
import type { Sponsorship } from "@/lib/types/sponsorship";
import { NewAnalysisTab } from "./new-analysis-tab";
import { InProgressTab } from "./in-progress-tab";
import { CompletedTab } from "./completed-tab";

type TabId = "new" | "progress" | "completed";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "new", label: "새 분석", icon: <SparkleIcon /> },
  { id: "progress", label: "진행 중", icon: <ClockIcon /> },
  { id: "completed", label: "완료", icon: <CheckIcon /> },
];

interface SponsorshipTabsProps {
  inProgress: Sponsorship[];
  completed: Sponsorship[];
}

export function SponsorshipTabs({
  inProgress,
  completed,
}: SponsorshipTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("new");

  function countFor(id: TabId): number | null {
    if (id === "progress" && inProgress.length > 0) return inProgress.length;
    if (id === "completed" && completed.length > 0) return completed.length;
    return null;
  }

  return (
    <div>
      {/* 탭 헤더 */}
      <div
        role="tablist"
        className="flex gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = countFor(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-br from-pink-50 to-rose-50 text-pink-700 shadow-sm ring-1 ring-pink-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center transition-transform ${
                  isActive
                    ? "text-pink-600 scale-110"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold tabular-nums transition-colors ${
                    isActive
                      ? "bg-pink-600 text-white shadow-sm"
                      : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                  }`}
                >
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

// ─── 아이콘 ─────────────────────────────────
function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}
