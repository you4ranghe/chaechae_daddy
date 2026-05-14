import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { TeamPanel } from "@/components/team/team-panel";
import { InvitationsList } from "@/components/team/invitations-list";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, role, joined_at, teams (id, name, owner_id, created_at)")
    .eq("user_id", user.id);

  const teams = (memberships || [])
    .map((m) => ({
      id: m.team_id,
      role: m.role as "owner" | "manager" | "influencer",
      joinedAt: m.joined_at,
      team: m.teams as unknown as {
        id: string;
        name: string;
        owner_id: string;
        created_at: string;
      } | null,
    }))
    .filter((m) => m.team);

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
    teamName:
      (inv.teams as unknown as { name: string } | null)?.name || "팀",
    role: inv.role as "manager" | "influencer",
    createdAt: inv.created_at,
  }));

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-white to-rose-50 px-6 py-6 sm:px-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-20 h-20 w-20 rounded-full bg-rose-200/40 blur-2xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">팀</h1>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              매니저가 여러 인플루언서를 한 곳에서 관리할 수 있어요
            </p>
          </div>
        </div>
      </section>

      {invitations.length > 0 && <InvitationsList invitations={invitations} />}

      {teams.length === 0 ? (
        <CreateTeamForm />
      ) : (
        <div className="space-y-5">
          {teams.map(
            (m) =>
              m.team && (
                <TeamPanel
                  key={m.team.id}
                  teamId={m.team.id}
                  teamName={m.team.name}
                  myRole={m.role}
                />
              ),
          )}
        </div>
      )}
    </div>
  );
}
