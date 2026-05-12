"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PerformanceFormProps {
  sponsorshipId: string;
}

export function PerformanceForm({ sponsorshipId }: PerformanceFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [reach, setReach] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
      >
        포스팅 성과 입력 →
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorshipId,
          likes: parseInt(likes) || 0,
          comments: parseInt(comments) || 0,
          reach: parseInt(reach) || 0,
          userNotes: notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "저장 실패");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <NumberInput placeholder="좋아요" value={likes} onChange={setLikes} />
        <NumberInput placeholder="댓글" value={comments} onChange={setComments} />
        <NumberInput placeholder="도달" value={reach} onChange={setReach} />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="후기 메모 (다음 콘텐츠 개선에 반영)"
        maxLength={2000}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function NumberInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
    />
  );
}
