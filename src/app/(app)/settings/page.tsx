import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ActiveGroupSwitcher } from "@/components/ActiveGroupSwitcher";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { ProfileForm } from "@/components/ProfileForm";
import { GroupSettingsForm } from "@/components/GroupSettingsForm";
import { QuestionsEditor } from "@/components/QuestionsEditor";
import { GroupMembersSection } from "@/components/GroupMembersSection";
import { PlatformAdminSection } from "@/components/PlatformAdminSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const groupIds = memberships?.map((m) => m.group_id) ?? [];
  const { data: groups } = groupIds.length
    ? await supabase.from("groups").select("id, name").in("id", groupIds)
    : { data: [] };

  const activeGroupId = profile?.active_group_id ?? null;

  // Group Settings (name/timezone/meeting day, questions, members) is
  // specific to whichever group is currently active, and only relevant if
  // the user administers that group.
  let activeGroup = null;
  let isAdminOfActiveGroup = false;
  let questions: { id: string; group_id: string; label_short: string; label_description: string; slot_number: number; goal_enabled: boolean }[] = [];
  let allMemberships: { id: string; user_id: string; role: string; status: string; joined_at: string }[] = [];
  let profileById = new Map<string, { first_name: string | null; last_name: string | null }>();

  if (activeGroupId) {
    const { data: g } = await supabase.from("groups").select("*").eq("id", activeGroupId).single();
    activeGroup = g;

    const { data: myMembership } = await supabase
      .from("memberships")
      .select("role")
      .eq("group_id", activeGroupId)
      .eq("user_id", user.id)
      .single();
    isAdminOfActiveGroup = myMembership?.role === "admin";

    if (isAdminOfActiveGroup) {
      const [{ data: qs }, { data: ms }] = await Promise.all([
        supabase
          .from("group_questions")
          .select("*")
          .eq("group_id", activeGroupId)
          .order("slot_number"),
        supabase
          .from("memberships")
          .select("id, user_id, role, status, joined_at")
          .eq("group_id", activeGroupId)
          .order("joined_at"),
      ]);
      questions = qs ?? [];
      allMemberships = ms ?? [];

      const memberUserIds = allMemberships.map((m) => m.user_id);
      const { data: memberProfiles } = memberUserIds.length
        ? await supabase.from("profiles").select("id, first_name, last_name").in("id", memberUserIds)
        : { data: [] };
      profileById = new Map((memberProfiles ?? []).map((p) => [p.id, p]));
    }
  }

  function nameFor(userId: string) {
    const p = profileById.get(userId);
    return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed" : "Unnamed";
  }

  const activeMembers = allMemberships.filter((m) => m.status === "active");
  const pendingMembers = allMemberships.filter((m) => m.status === "pending");
  const otherMembers = allMemberships.filter(
    (m) => m.status !== "active" && m.status !== "pending"
  );

  const { data: platformSettings } = profile?.platform_admin
    ? await supabase
        .from("platform_settings")
        .select("resource_link_url, resource_link_label")
        .single()
    : { data: null };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <p className="text-sm text-neutral-500">{profile?.email}</p>

      {profile && <ProfileForm profile={profile} />}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">Your groups</h2>
        <ActiveGroupSwitcher
          userId={user.id}
          groups={groups ?? []}
          activeGroupId={activeGroupId}
        />
      </div>

      <JoinGroupForm />
      <CreateGroupForm />

      {isAdminOfActiveGroup && activeGroup && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">
            Group Settings — {activeGroup.name}
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500">Group code</p>
            <p className="mt-1 font-mono text-2xl tracking-wider">{activeGroup.code}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Share this with the men you want in the group.
            </p>
          </div>
          <GroupMembersSection
            currentUserId={user.id}
            activeMembers={activeMembers}
            pendingMembers={pendingMembers}
            otherMembers={otherMembers}
            nameFor={nameFor}
          />
          <GroupSettingsForm group={activeGroup} />
          <QuestionsEditor
            key={questions.map((q) => q.id).join("-")}
            groupId={activeGroup.id}
            questions={questions}
          />
        </div>
      )}

      {profile?.platform_admin && (
        <PlatformAdminSection
          initialLinkUrl={platformSettings?.resource_link_url ?? null}
          initialLinkLabel={platformSettings?.resource_link_label ?? null}
        />
      )}

      <LogoutButton />
    </div>
  );
}
