import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { TeamPanel } from "@/components/team/team-panel";
import { InvitationsList } from "@/components/team/invitations-list";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 내가 속한 팀 조회 — 멤버십을 통해
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, role, joined_at, teams (id, name, owner_id, created_at)")
    .eq("user_id", user.id);

  const teams = (memberships || [])
    .map((m) => ({
      id: m.team_id,
      role: m.role as "owner" | "manager" | "influencer",
      joinedAt: m.joined_at,
      team: m.teams as unknown as { id: string; name: string; owner_id: string; created_at: string } | null,
    }))
    .filter((m) => m.team);

  // 받은 초대 조회
  const { data: pendingInvitations } = user.email
    ? await supabase
        .from("team_invitations")
        .select("id, team_id, role, created_at, teams (name)")
        .eq("invited_email", user.email.toLowerCase())
        .is("accepted_at", null)
    : { data: [] };

  const invitations = (pendingInvitations || []).map((inv) => ({
    id: inv.id,
    teamId: inv.team_id,
    teamName: (inv.teams as unknown as { name: string } | null)?.name || "팀",
    role: inv.role as "manager" | "influencer",
    createdAt: inv.created_at,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">팀</h1>
        <p className="mt-1 text-sm text-gray-500">
          매니저가 여러 인플루언서를 한 곳에서 관리할 수 있어요
        </p>
      </div>

      {invitations.length > 0 && (
        <div className="mb-6">
          <InvitationsList invitations={invitations} />
        </div>
      )}

      {teams.length === 0 ? (
        <CreateTeamForm />
      ) : (
        <div className="space-y-6">
          {teams.map((m) => m.team && (
            <TeamPanel
              key={m.team.id}
              teamId={m.team.id}
              teamName={m.team.name}
              myRole={m.role}
            />
          ))}
        </div>
      )}
    </>
  );
}
