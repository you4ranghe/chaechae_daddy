"use client";

import { useMemo, useState } from "react";

interface ChildInfo {
  name?: string | null;
  birth_date?: string | null;
  gender?: "female" | "male" | "other" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
  measurements_updated_at?: string | null;
}

interface ChildInfoCardProps {
  initialChildInfo: ChildInfo | null;
  initialPersonaBio: string;
}

const STALE_DAYS = 30;

export function ChildInfoCard({
  initialChildInfo,
  initialPersonaBio,
}: ChildInfoCardProps) {
  const [name, setName] = useState(initialChildInfo?.name || "");
  const [birthDate, setBirthDate] = useState(initialChildInfo?.birth_date || "");
  const [gender, setGender] = useState<ChildInfo["gender"]>(
    initialChildInfo?.gender || null,
  );
  const [height, setHeight] = useState<string>(
    initialChildInfo?.height_cm ? String(initialChildInfo.height_cm) : "",
  );
  const [weight, setWeight] = useState<string>(
    initialChildInfo?.weight_kg ? String(initialChildInfo.weight_kg) : "",
  );
  const [notes, setNotes] = useState(initialChildInfo?.notes || "");
  const [bio, setBio] = useState(initialPersonaBio);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const ageLabel = useMemo(() => {
    if (!birthDate) return null;
    const b = new Date(birthDate);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    if (b.getTime() > now.getTime()) return "출생일이 미래에요";
    const years = now.getFullYear() - b.getFullYear();
    let months = years * 12 + (now.getMonth() - b.getMonth());
    if (now.getDate() < b.getDate()) months -= 1;
    months = Math.max(0, months);
    const y = Math.floor(months / 12);
    const r = months % 12;
    if (y === 0) return `현재 ${months}개월`;
    if (r === 0) return `현재 만 ${y}세 (${months}개월)`;
    return `현재 만 ${y}세 ${r}개월 (총 ${months}개월)`;
  }, [birthDate]);

  const measurementsStale = useMemo(() => {
    if (!initialChildInfo?.measurements_updated_at) return null;
    const d = new Date(initialChildInfo.measurements_updated_at);
    if (isNaN(d.getTime())) return null;
    const diffDays = Math.floor(
      (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000),
    );
    return { days: diffDays, stale: diffDays > STALE_DAYS };
  }, [initialChildInfo?.measurements_updated_at]);

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childInfo: {
            name: name.trim() || null,
            birth_date: birthDate || null,
            gender,
            height_cm: height ? Number(height) : null,
            weight_kg: weight ? Number(weight) : null,
            notes: notes.trim() || null,
          },
          personaBio: bio,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "저장 실패");
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bezel overflow-hidden">
      <div className="border-b border-gray-100 bg-gradient-to-r from-rose-50/50 to-amber-50/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-amber-400 shadow-sm">
            <BabyIcon className="h-4 w-4 text-white" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-gray-900">아이 정보 · 자기소개</h2>
            <p className="text-[11px] text-gray-500">
              입력하면 AI가 협찬 응답·콘텐츠를 더 자연스럽게 만들어요. 모두 선택사항이에요.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* 아이 기본 정보 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="아이 이름">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              placeholder="예: 채채"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </Field>
          <Field
            label="생년월일"
            hint={ageLabel || "AI가 분석할 때 자동으로 개월수를 계산해요"}
          >
            <input
              type="date"
              value={birthDate}
              max={todayISO()}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </Field>
        </div>

        <Field label="성별">
          <div className="flex gap-2">
            <GenderPill
              active={gender === "female"}
              onClick={() => setGender(gender === "female" ? null : "female")}
              label="여아"
              color="rose"
            />
            <GenderPill
              active={gender === "male"}
              onClick={() => setGender(gender === "male" ? null : "male")}
              label="남아"
              color="indigo"
            />
            <GenderPill
              active={gender === "other"}
              onClick={() => setGender(gender === "other" ? null : "other")}
              label="비공개"
              color="gray"
            />
          </div>
        </Field>

        {/* 키/몸무게 */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-gray-700">키 · 몸무게</p>
            {measurementsStale && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  measurementsStale.stale
                    ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                }`}
              >
                <ClockIcon className="h-2.5 w-2.5" />
                {measurementsStale.stale
                  ? `${measurementsStale.days}일 전 — AI 활용 안 함`
                  : `${measurementsStale.days}일 전`}
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              value={height}
              onChange={setHeight}
              suffix="cm"
              placeholder="65"
              step="0.1"
            />
            <NumberField
              value={weight}
              onChange={setWeight}
              suffix="kg"
              placeholder="7.2"
              step="0.1"
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
            30일 이상 업데이트하지 않으면 개월수와 안 맞을 수 있어서 AI가 자동으로 무시해요.
          </p>
        </div>

        {/* 특이사항 */}
        <Field label="특이사항" hint="알레르기, 좋아하는 활동 등">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 200))}
            placeholder="예: 우유 알레르기, 이유식 시작"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          />
        </Field>

        {/* 자기소개 */}
        <Field
          label="자기소개 · 선호하는 AI 답변 톤"
          hint="AI에게 알려주고 싶은 본인 스타일이나 캡션 톤"
        >
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 2000))}
            rows={4}
            placeholder="예: 친근한 반말 톤을 좋아하고 짧은 문장을 선호해요. 협업 카테고리는 유아용품·이유식 중심이에요."
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-900 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          />
          <p className="mt-1 text-right text-[11px] text-gray-400">{bio.length}/2000</p>
        </Field>

        {/* 저장 */}
        <div className="flex items-center justify-end gap-3">
          {status === "saved" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckIcon className="h-3.5 w-3.5" />
              저장됨
            </span>
          )}
          {status === "error" && (
            <span className="text-xs font-bold text-rose-600">{errorMsg}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-gray-700">
        {label}
        {hint && <span className="text-[10.5px] font-medium text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  suffix,
  placeholder,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        min={0}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm tabular-nums text-gray-900 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
        {suffix}
      </span>
    </div>
  );
}

function GenderPill({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: "rose" | "indigo" | "gray";
}) {
  const activeClass =
    color === "rose"
      ? "border-rose-300 bg-rose-50 text-rose-700"
      : color === "indigo"
        ? "border-pink-300 bg-pink-50 text-pink-700"
        : "border-gray-300 bg-gray-50 text-gray-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
        active
          ? activeClass
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function BabyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 8c4.418 0 8 2.239 8 5v1H4v-1c0-2.761 3.582-5 8-5Z" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ClockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
  );
}
