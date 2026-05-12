"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  role: "manager" | "influencer";
  createdAt: string;
}

interface InvitationsListProps {
  invitations: Invitation[];
}

export function InvitationsList({ invitations }: InvitationsListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function respond(id: string, action: "accept" | "decline") {
    setLoading(id);
    try {
      await fetch(`/api/team/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
      <h2 className="text-sm font-semibold text-indigo-900">팀 초대가 도착했어요</h2>
      <div className="mt-3 space-y-2">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between rounded-lg bg-white p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{inv.teamName}</p>
              <p className="text-xs text-gray-400">
                {inv.role === "manager" ? "매니저" : "인플루언서"}로 초대
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => respond(inv.id, "accept")}
                disabled={loading === inv.id}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                수락
              </button>
              <button
                type="button"
                onClick={() => respond(inv.id, "decline")}
                disabled={loading === inv.id}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                거절
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
