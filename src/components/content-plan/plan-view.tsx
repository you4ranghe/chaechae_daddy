"use client";

import { useState } from "react";
import { CopyButton } from "@/components/sponsorship/copy-button";
import type { WeeklyPlanResult, DailyPlan } from "@/lib/agents/weekly-planner";

const TYPE_COLORS: Record<string, string> = {
  "릴스": "bg-pink-100 text-pink-700",
  "캐러셀": "bg-blue-100 text-blue-700",
  "단일이미지": "bg-amber-100 text-amber-700",
};

function DayCard({ plan }: { plan: DailyPlan }) {
  const [expanded, setExpanded] = useState(false);
  const hashtagText = plan.hashtags.map((t) => t.startsWith("#") ? t : `#${t}`).join(" ");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">{plan.day}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{plan.topic}</p>
            <p className="text-xs text-gray-500">{plan.bestTime}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[plan.contentType] || "bg-gray-100 text-gray-600"}`}>
          {plan.contentType}
        </span>
      </div>

      <p className="mt-2 text-xs text-indigo-600">{plan.angle}</p>

      <button type="button" onClick={() => setExpanded(!expanded)} className="mt-3 text-sm text-gray-400 hover:text-gray-600">
        {expanded ? "접기" : "캡션 보기"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">캡션</span>
              <CopyButton text={plan.caption} label="복사" />
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{plan.caption}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">해시태그 ({plan.hashtags.length}개)</span>
              <CopyButton text={hashtagText} label="복사" />
            </div>
            <div className="flex flex-wrap gap-1">
              {plan.hashtags.map((tag, i) => (
                <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyPlanView({ result }: { result: WeeklyPlanResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="flex gap-4 text-sm">
          {Object.entries(
            result.weeklyPlan.reduce<Record<string, number>>((acc, p) => {
              acc[p.contentType] = (acc[p.contentType] || 0) + 1;
              return acc;
            }, {})
          ).map(([type, count]) => (
            <span key={type} className={`rounded-full px-3 py-1 font-medium ${TYPE_COLORS[type] || "bg-gray-100"}`}>
              {type} {count}개
            </span>
          ))}
        </div>
      </div>

      {result.weeklyPlan.map((plan, i) => (
        <DayCard key={i} plan={plan} />
      ))}
    </div>
  );
}
