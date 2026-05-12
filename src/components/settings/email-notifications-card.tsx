"use client";

import { useState } from "react";

interface EmailNotificationsCardProps {
  initialPrefs: {
    trial_reminder: boolean;
    analysis_complete: boolean;
  };
  email: string;
}

export function EmailNotificationsCard({ initialPrefs, email }: EmailNotificationsCardProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function update(next: typeof prefs) {
    setSaving(true);
    setMessage(null);
    const prev = prefs;
    setPrefs(next);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: next }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPrefs(prev);
        setMessage({ type: "error", text: data.error || "저장에 실패했습니다." });
        return;
      }

      setMessage({ type: "success", text: "알림 설정이 저장됐어요." });
    } catch {
      setPrefs(prev);
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">이메일 알림</h2>
          <p className="mt-1 text-xs text-gray-400">{email}로 발송됩니다</p>
        </div>
        {saving && <span className="text-xs text-gray-400">저장 중…</span>}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-4 divide-y divide-gray-100">
        <ToggleRow
          title="무료 체험 만료 알림"
          description="체험 종료 3일 전, 1일 전에 안내 메일을 받아요."
          checked={prefs.trial_reminder}
          disabled={saving}
          onChange={(checked) => update({ ...prefs, trial_reminder: checked })}
        />
        <ToggleRow
          title="AI 분석 완료 알림"
          description="협찬 분석, 성과 리포트 등이 완료되면 알려드려요."
          checked={prefs.analysis_complete}
          disabled={saving}
          onChange={(checked) => update({ ...prefs, analysis_complete: checked })}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="pr-4">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-gray-200"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
