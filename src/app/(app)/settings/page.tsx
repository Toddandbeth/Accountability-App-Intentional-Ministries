import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ActiveGroupSwitcher } from "@/components/ActiveGroupSwitcher";
import { HiddenGroupsSection } from "@/components/HiddenGroupsSection";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { ProfileForm } from "@/components/ProfileForm";
import { GroupSettingsForm } from "@/components/GroupSettingsForm";
import { QuestionsEditor } from "@/components/QuestionsEditor";
import { GroupMembersSection } from "@/components/GroupMembersSection";
import { PlatformAdminSection } from "@/components/PlatformAdminSection";
import { SlideOverPanel } from "@/components/SlideOverPanel";
import { HelpAndTipsSection } from "@/components/HelpAndTipsSection";
import { CopyAppLink } from "@/components/CopyAppLink";
import { DeactivateGroupButton } from "@/components/DeactivateGroupButton";
import type { GroupBasicInfo, GroupQuestion } from "@/lib/supabase/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const activeGroupId = profile?.active_group_id ?? null;

  // One parallel batch. Memberships list: any status, not just active —
  // it drives the visible/hidden active list below plus the "past groups"
  // section for removed/inactive memberships, which retain access to their
  // own history but not the live group. The rest only need
  // activeGroupId/user.id, so they don't wait on it. Questions and the
  // member list are fetched speculatively and kept only if the user turns
  // out to be an admin (RLS limits them anyway) — one fewer round trip.
  const [
    { data: myMemberships },
    { data: platformSettings },
    { data: g },
    { data: myMembership },
    { data: qs },
    { data: ms },
  ] = await Promise.all([
    supabase.from("memberships").select("id, group_id, status, hidden_by_user").eq("user_id", user.id),
    profile?.platform_admin
      ? supabase.from("platform_settings").select("resource_link_url, resource_link_label").single()
      : { data: null },
    activeGroupId
      ? supabase.from("groups").select("*").eq("id", activeGroupId).single()
      : { data: null },
    activeGroupId
      ? supabase
          .from("memberships")
          .select("role, status")
          .eq("group_id", activeGroupId)
          .eq("user_id", user.id)
          .single()
      : { data: null },
    activeGroupId
      ? supabase.from("group_questions").select("*").eq("group_id", activeGroupId).order("slot_number")
      : { data: null },
    activeGroupId
      ? supabase
          .from("memberships")
          .select("id, user_id, role, status, joined_at")
          .eq("group_id", activeGroupId)
          .order("joined_at")
      : { data: null },
  ]);

  const myMembershipList = myMemberships ?? [];
  const activeGroup = g ?? null;
  const isAdminOfActiveGroup = myMembership?.role === "admin";
  const questions: GroupQuestion[] = isAdminOfActiveGroup ? (qs ?? []) : [];
  const allMemberships: { id: string; user_id: string; role: string; status: string; joined_at: string }[] =
    isAdminOfActiveGroup ? (ms ?? []) : [];

  // groups RLS only allows reading active-membership groups directly, so
  // basic info (name, is_active) for every group — including past ones —
  // comes from this narrow RPC instead. Member names are independent of
  // that, so they load in the same batch.
  const groupInfoById = new Map<string, GroupBasicInfo>();
  const memberUserIds = allMemberships.map((m) => m.user_id);
  const [, { data: memberProfiles }] = await Promise.all([
    Promise.all(
      myMembershipList.map(async (m) => {
        const { data: info } = await supabase
          .rpc("get_group_basic_info", { p_group_id: m.group_id })
          .single();
        if (info) groupInfoById.set(m.group_id, info as GroupBasicInfo);
      })
    ),
    memberUserIds.length
      ? supabase.from("profiles").select("id, first_name, last_name").in("id", memberUserIds)
      : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] },
  ]);
  const profileById = new Map((memberProfiles ?? []).map((p) => [p.id, p]));

  const activeGroupIdForSort = profile?.active_group_id ?? null;

  // Switching your active group moves it to the top of the list, not
  // just highlighting it in place.
  const visibleActiveGroups = myMembershipList
    .filter((m) => m.status === "active" && !m.hidden_by_user)
    .map((m) => ({
      id: m.group_id,
      membershipId: m.id,
      name: groupInfoById.get(m.group_id)?.name ?? "Unnamed group",
      isDeactivated: groupInfoById.get(m.group_id)?.is_active === false,
    }))
    .sort((a, b) => Number(b.id === activeGroupIdForSort) - Number(a.id === activeGroupIdForSort));

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
      <h1 className="text-3xl font-extrabold text-brand-navy">Settings</h1>

      {profile && <ProfileForm profile={profile} />}

      <HelpAndTipsSection />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-brand-navy">Your groups</h2>
        <ActiveGroupSwitcher
          userId={user.id}
          groups={visibleActiveGroups}
          activeGroupId={activeGroupId}
          canRenameActive={isAdminOfActiveGroup}
        />
        <HiddenGroupsSection groups={hiddenActiveGroups} />
      </div>

      {isAdminOfActiveGroup && activeGroup && (
        <div className="space-y-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-[17px] font-semibold text-neutral-500">Group code</p>
            <p className="mt-1 font-mono text-2xl tracking-wider text-brand-navy">
              {activeGroup.code}
            </p>
            <p className="mt-1 text-[17px] text-neutral-500">
              Share this with the men you want in the group.
            </p>
          </div>
          <GroupSettingsForm group={activeGroup} />
          <SlideOverPanel label="Weekly Questions" title="Weekly Questions">
            <QuestionsEditor
              key={questions.map((q) => q.id).join("-")}
              groupId={activeGroup.id}
              questions={questions}
            />
          </SlideOverPanel>
          <GroupMembersSection
            currentUserId={user.id}
            activeMembers={activeMembers}
            pendingMembers={pendingMembers}
            otherMembers={otherMembers}
            nameFor={nameFor}
          />
        </div>
      )}

      {pastGroups.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-brand-navy">Past groups</h2>
          <div className="space-y-2">
            {pastGroups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-[17px]"
              >
                <span className="text-neutral-600">{g.name}</span>
                <span className="flex shrink-0 gap-3">
                  <Link
                    href={`/history?group=${g.id}`}
                    className="text-[17px] font-medium text-neutral-500 underline"
                  >
                    Your history
                  </Link>
                  {g.isDeactivated && (
                    <Link
                      href={`/roster/${g.id}`}
                      className="text-[17px] font-medium text-neutral-500 underline"
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

      <CopyAppLink />

      <div className="space-y-3">
        <JoinGroupForm />
        <CreateGroupForm />

        {isAdminOfActiveGroup && activeGroup && (
          <div className="mt-2 space-y-2 rounded-xl border border-red-100 bg-white p-4">
            <h2 className="text-xl font-semibold text-red-600">Deactivate this group</h2>
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
