"use client";

import type { ChecklistItem, GeneratedContent } from "@/lib/types/sponsorship";
import { CopyButton } from "./copy-button";
import { useState } from "react";

interface ContentResultProps {
  checklist: ChecklistItem[];
  content: GeneratedContent;
}

export function ContentResult({ checklist, content }: ContentResultProps) {
  const [items, setItems] = useState(checklist);

  function toggleItem(id: string) {
    setItems(function (prev) {
      return prev.map(function (item) {
        if (item.id === id) {
          return { ...item, checked: !item.checked };
        }
        return item;
      });
    });
  }

  const completedCount = items.filter(function (i) {
    return i.checked;
  }).length;

  const hashtagText = content.hashtags.map(function (tag) {
    return tag.startsWith("#") ? tag : `#${tag}`;
  }).join(" ");

  return (
    <div className="mt-6 space-y-4">
      {/* 체크리스트 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">
            광고주 요구사항 체크리스트
          </h3>
          <span className="text-xs text-gray-400">
            {completedCount}/{items.length} 완료
          </span>
        </div>
        {/* 프로그레스 */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
          />
        </div>
        <ul className="mt-4 space-y-2">
          {items.map(function (item) {
            return (
              <li key={item.id}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className={`text-sm transition-colors ${
                      item.checked
                        ? "text-gray-400 line-through"
                        : "text-gray-700 group-hover:text-gray-900"
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 생성된 캡션 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">생성된 캡션</h3>
          <CopyButton text={content.caption} label="캡션 복사" />
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {content.caption}
          </p>
        </div>
      </div>

      {/* 해시태그 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">
            해시태그 ({content.hashtags.length}개)
          </h3>
          <CopyButton text={hashtagText} label="해시태그 복사" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {content.hashtags.map(function (tag, i) {
            const display = tag.startsWith("#") ? tag : `#${tag}`;
            return (
              <span
                key={i}
                className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600"
              >
                {display}
              </span>
            );
          })}
        </div>
      </div>

      {/* 완료 안내 */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
        <p className="text-sm font-medium text-emerald-800">
          캡션과 해시태그를 복사해서 인스타그램에 바로 포스팅하세요!
        </p>
      </div>
    </div>
  );
}
