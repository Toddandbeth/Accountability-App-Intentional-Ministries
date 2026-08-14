import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MembershipRequestRow } from "@/components/MembershipRequestRow";
import { GroupSettingsForm } from "@/components/GroupSettingsForm";
import { QuestionsEditor } from "@/components/QuestionsEditor";
import { weekdayName } from "@/lib/weekdays";
import type { MembershipStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  pending: "Pending",
  removed: "Removed",
  inactive: "Inactive",
};

export default async function GroupPage() {
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

  if (!profile?.active_group_id) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Group</h1>
        <p className="text-sm text-neutral-600">
          You&apos;re not part of a group yet.{" "}
          <Link href="/checkin" className="underline">
            Create or join one
          </Link>
          .
        </p>
      </div>
    );
  }

  const groupId = profile.active_group_id;

  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).single();

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const isAdmin = myMembership?.role === "admin";

  // Admins can see every membership row (any status) for this group — RLS
  // only allows this for admins; a regular member's query would just come
  // back scoped to their own row plus whatever "active" rows pass the
  // shared-group visibility policy, so we ask for "active" explicitly for
  // the plain member list everyone sees.
  const { data: allMemberships } = isAdmin
    ? await supabase
        .from("memberships")
        .select("id, user_id, role, status, joined_at")
        .eq("group_id", groupId)
        .order("joined_at")
    : { data: null };

  const { data: activeMembershipsOnly } = !isAdmin
    ? await supabase
        .from("memberships")
        .select("id, user_id, role, status, joined_at")
        .eq("group_id", groupId)
        .eq("status", "active")
        .order("joined_at")
    : { data: null };

  const memberships = allMemberships ?? activeMembershipsOnly ?? [];

  const userIds = memberships.map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  function nameFor(userId: string) {
    const p = profileById.get(userId);
    return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed" : "Unnamed";
  }

  const activeMembers = memberships.filter((m) => m.status === "active");
  const pendingMembers = memberships.filter((m) => m.status === "pending");
  const otherMembers = memberships.filter(
    (m) => m.status !== "active" && m.status !== "pending"
  );

  const { data: questions } = isAdmin
    ? await supabase
        .from("group_questions")
        .select("*")
        .eq("group_id", groupId)
        .order("slot_number")
    : { data: null };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{group?.name}</h1>
        <p className="text-sm text-neutral-600">
          Meets {group ? weekdayName(group.meeting_day) : ""}
        </p>
      </div>

      {group?.resource_link_url && (
        <a
          href={group.resource_link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-neutral-200 bg-white p-4"
        >
          <p className="text-xs font-semibold text-neutral-500">Resource</p>
          <p className="mt-1 text-sm font-medium underline">
            {group.resource_link_label || group.resource_link_url}
          </p>
        </a>
      )}

      {isAdmin && group && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold text-neutral-500">Group code</p>
          <p className="mt-1 font-mono text-2xl tracking-wider">{group.code}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Share this with the men you want in the group.
          </p>
        </div>
      )}

      {isAdmin && pendingMembers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">
            Join requests ({pendingMembers.length})
          </h2>
          {pendingMembers.map((m) => (
            <MembershipRequestRow key={m.id} membershipId={m.id} name={nameFor(m.user_id)} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">
          Members ({activeMembers.length})
        </h2>
        {activeMembers.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
          >
            <span className="text-sm">{nameFor(m.user_id)}</span>
            <span className="flex gap-1">
              {m.role === "admin" && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  Admin
                </span>
              )}
              {isAdmin && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {STATUS_LABELS[m.status as MembershipStatus]}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {isAdmin && otherMembers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">Former members</h2>
          {otherMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
            >
              <span className="text-sm text-neutral-500">{nameFor(m.user_id)}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                {STATUS_LABELS[m.status as MembershipStatus]}
              </span>
            </div>
          ))}
        </div>
      )}

      {isAdmin && group && (
        <>
          <GroupSettingsForm group={group} />
          <QuestionsEditor
            key={(questions ?? []).map((q) => q.id).join("-")}
            groupId={group.id}
            questions={questions ?? []}
          />
        </>
      )}
    </div>
  );
}
