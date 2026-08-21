import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ActiveGroupSwitcher } from "@/components/ActiveGroupSwitcher";
import { HiddenGroupsSection } from "@/components/HiddenGroupsSection";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { ProfileForm } from "@/components/ProfileForm";
import { GroupSettingsForm } from "@/components/GroupSettingsForm";
import { HowThisWorksSection } from "@/components/HowThisWorksSection";
import { QuestionsEditor } from "@/components/QuestionsEditor";
import { GroupMembersSection } from "@/components/GroupMembersSection";
import { PlatformAdminSection } from "@/components/PlatformAdminSection";
import { SlideOverPanel } from "@/components/SlideOverPanel";
import { DeactivateGroupButton } from "@/components/DeactivateGroupButton";
import type { GroupBasicInfo } from "@/lib/supabase/types";

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

  // Any status, not just active — this drives the visible/hidden active
  // list below plus the "past groups" section for removed/inactive
  // memberships, which retain access to their own history but not the
  // live group. platformSettings doesn't depend on anything above it, so
  // it's fetched here too rather than waiting until the end of the page.
  const [{ data: myMemberships }, { data: platformSettings }] = await Promise.all([
    supabase.from("memberships").select("id, group_id, status, hidden_by_user").eq("user_id", user.id),
    profile?.platform_admin
      ? supabase.from("platform_settings").select("resource_link_url, resource_link_label").single()
      : { data: null },
  ]);

  const myMembershipList = myMemberships ?? [];

  // groups RLS only allows reading active-membership groups directly, so
  // basic info (name, is_active) for every group — including past ones —
  // comes from this narrow RPC instead.
  const groupInfoById = new Map<string, GroupBasicInfo>();
  await Promise.all(
    myMembershipList.map(async (m) => {
      const { data: info } = await supabase
        .rpc("get_group_basic_info", { p_group_id: m.group_id })
        .single();
      if (info) groupInfoById.set(m.group_id, info as GroupBasicInfo);
    })
  );

  const visibleActiveGroups = myMembershipList
    .filter((m) => m.status === "active" && !m.hidden_by_user)
    .map((m) => ({
      id: m.group_id,
      membershipId: m.id,
      name: groupInfoById.get(m.group_id)?.name ?? "Unnamed group",
      isDeactivated: groupInfoById.get(m.group_id)?.is_active === false,
    }));

  const hiddenActiveGroups = myMembershipList
    .filter((m) => m.status === "active" && m.hidden_by_user)
    .map((m) => ({
      id: m.group_id,
      membershipId: m.id,
      name: groupInfoById.get(m.group_id)?.name ?? "Unnamed group",
    }));

  const pastGroups = myMembershipList
    .filter((m) => m.status !== "active" && m.status !== "pending")
    .map((m) => ({
      id: m.group_id,
      name: groupInfoById.get(m.group_id)?.name ?? "Unnamed group",
      isDeactivated: groupInfoById.get(m.group_id)?.is_active === false,
    }));

  const activeGroupId = profile?.active_group_id ?? null;

  // Group Settings (meeting day/timezone, questions, members) is specific
  // to whichever group is currently active, and only relevant if the user
  // administers that group.
  let activeGroup = null;
  let isAdminOfActiveGroup = false;
  let questions: { id: string; group_id: string; label_short: string; label_description: string; slot_number: number; goal_enabled: boolean }[] = [];
  let allMemberships: { id: string; user_id: string; role: string; status: string; joined_at: string }[] = [];
  let profileById = new Map<string, { first_name: string | null; last_name: string | null }>();

  if (activeGroupId) {
    // Independent of each other — both only need activeGroupId/user.id.
    const [{ data: g }, { data: myMembership }] = await Promise.all([
      supabase.from("groups").select("*").eq("id", activeGroupId).single(),
      supabase
        .from("memberships")
        .select("role, status")
        .eq("group_id", activeGroupId)
        .eq("user_id", user.id)
        .single(),
    ]);
    activeGroup = g;
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <p className="text-sm text-neutral-500">{profile?.email}</p>

      {profile && <ProfileForm profile={profile} />}

      <HowThisWorksSection />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">Your groups</h2>
        <ActiveGroupSwitcher
          userId={user.id}
          groups={visibleActiveGroups}
          activeGroupId={activeGroupId}
          activeGroupExtra={
            isAdminOfActiveGroup && activeGroup ? (
              <>
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-neutral-500">Group code</p>
                  <p className="mt-1 font-mono text-2xl tracking-wider">{activeGroup.code}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Share this with the men you want in the group.
                  </p>
                </div>
                <GroupSettingsForm group={activeGroup} />
                <GroupMembersSection
                  currentUserId={user.id}
                  activeMembers={activeMembers}
                  pendingMembers={pendingMembers}
                  otherMembers={otherMembers}
                  nameFor={nameFor}
                />
              </>
            ) : undefined
          }
        />
        <HiddenGroupsSection groups={hiddenActiveGroups} />
      </div>

      {pastGroups.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">Past groups</h2>
          <div className="space-y-2">
            {pastGroups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-sm"
              >
                <span className="text-neutral-600">{g.name}</span>
                <span className="flex shrink-0 gap-3">
                  <Link
                    href={`/history?group=${g.id}`}
                    className="text-xs font-medium text-neutral-500 underline"
                  >
                    Your history
                  </Link>
                  {g.isDeactivated && (
                    <Link
                      href={`/roster/${g.id}`}
                      className="text-xs font-medium text-neutral-500 underline"
                    >
                      Roster
                    </Link>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdminOfActiveGroup && activeGroup && (
        <SlideOverPanel label="Weekly Questions" title="Weekly Questions">
          <QuestionsEditor
            key={questions.map((q) => q.id).join("-")}
            groupId={activeGroup.id}
            questions={questions}
          />
        </SlideOverPanel>
      )}

      <div className="space-y-3">
        <JoinGroupForm />
        <CreateGroupForm />

        {isAdminOfActiveGroup && activeGroup && (
          <div className="mt-2 space-y-2 rounded-xl border border-red-100 bg-white p-4">
            <h2 className="text-sm font-semibold text-red-600">Deactivate this group</h2>
            <DeactivateGroupButton groupId={activeGroup.id} isActive={activeGroup.is_active} />
          </div>
        )}
      </div>

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
