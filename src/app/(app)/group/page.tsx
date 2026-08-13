import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MembershipRequestRow } from "@/components/MembershipRequestRow";
import { GroupSettingsForm } from "@/components/GroupSettingsForm";
import { QuestionsEditor } from "@/components/QuestionsEditor";
import { weekdayName } from "@/lib/weekdays";

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

  const { data: activeMemberships } = await supabase
    .from("memberships")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("joined_at");

  const activeUserIds = activeMemberships?.map((m) => m.user_id) ?? [];
  const { data: activeProfiles } = activeUserIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", activeUserIds)
    : { data: [] };
  const activeProfileById = new Map((activeProfiles ?? []).map((p) => [p.id, p]));

  let pendingRows: { id: string; name: string }[] = [];
  if (isAdmin) {
    const { data: pendingMemberships } = await supabase
      .from("memberships")
      .select("id, user_id")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("joined_at");

    const pendingUserIds = pendingMemberships?.map((m) => m.user_id) ?? [];
    const { data: pendingProfiles } = pendingUserIds.length
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", pendingUserIds)
      : { data: [] };
    const pendingProfileById = new Map((pendingProfiles ?? []).map((p) => [p.id, p]));

    pendingRows = (pendingMemberships ?? []).map((m) => {
      const p = pendingProfileById.get(m.user_id);
      const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed" : "Unnamed";
      return { id: m.id, name };
    });
  }

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

      {isAdmin && pendingRows.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">
            Join requests ({pendingRows.length})
          </h2>
          {pendingRows.map((row) => (
            <MembershipRequestRow key={row.id} membershipId={row.id} name={row.name} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">
          Members ({activeMemberships?.length ?? 0})
        </h2>
        {(activeMemberships ?? []).map((m) => {
          const p = activeProfileById.get(m.user_id);
          const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed" : "Unnamed";
          return (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
            >
              <span className="text-sm">{name}</span>
              {m.role === "admin" && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  Admin
                </span>
              )}
            </div>
          );
        })}
      </div>

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
