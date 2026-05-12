"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeamPanelProps {
  teamId: string;
  teamName: string;
  myRole: "owner" | "manager" | "influencer";
}

interface Member {
  user_id: string;
  role: "owner" | "manager" | "influencer";
  invited_email: string | null;
  joined_at: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  role: "manager" | "influencer";
  created_at: string;
}

export function TeamPanel({ teamId, teamName, myRole }: TeamPanelProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "influencer">("influencer");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const canInvite = myRole === "owner" || myRole === "manager";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [membersRes, pendingRes] = await Promise.all([
        fetch(`/api/team/${teamId}/members`),
        fetch(`/api/team/${teamId}/pending`),
      ]);
      if (cancelled) return;
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(data.invitations || []);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [teamId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviting(true);
    try {
      const res = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "초대 실패");
        return;
      }
      setEmail("");
      setPending((prev) => [...prev, data.invitation]);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{teamName}</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            내 역할: <span className="font-medium">{roleLabel(myRole)}</span>
          </p>
        </div>
      </div>

      {/* 멤버 리스트 */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">멤버 ({members.length})</h3>
        <div className="mt-2 divide-y divide-gray-100">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between py-2.5">
              <div className="text-sm text-gray-900">
                {m.invited_email || m.user_id.slice(0, 8)}
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {roleLabel(m.role)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 대기 중 초대 */}
      {pending.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">초대 대기 ({pending.length})</h3>
          <div className="mt-2 divide-y divide-gray-100">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div className="text-sm text-gray-600">{p.invited_email}</div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  {roleLabel(p.role)} 대기
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 초대 폼 */}
      {canInvite && (
        <form onSubmit={handleInvite} className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">멤버 초대</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "manager" | "influencer")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="influencer">인플루언서</option>
              <option value="manager">매니저</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !email.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {inviting ? "초대 중…" : "초대"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </form>
      )}
    </div>
  );
}

function roleLabel(role: string): string {
  return role === "owner" ? "소유자" : role === "manager" ? "매니저" : "인플루언서";
}
