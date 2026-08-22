import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardRow } from "@/components/DashboardRow";
import { DashboardColumnHeaders } from "@/components/DashboardColumnHeaders";
import { GroupUpdateBar } from "@/components/GroupUpdateBar";
import { shortColumnLabel } from "@/lib/questions";

export default async function DashboardPage() {
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
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
        <p className="text-[17px] text-neutral-600">
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

  if (!group) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-brand-navy">No longer a member</h1>
        <p className="text-[17px] text-neutral-600">
          You&apos;re no longer an active member of that group.{" "}
          <Link href="/settings" className="underline">
            Switch groups or join another
          </Link>
          .
        </p>
      </div>
    );
  }

  // These five only depend on groupId/user.id (already known), not on each
  // other, so they run as one batch of round-trips instead of five in a row.
  const [
    { data: weekStart },
    { data: questions },
    { data: platformSettings },
    { data: myMembership },
    { data: memberships },
  ] = await Promise.all([
    supabase.rpc("current_week_start", { p_group_id: groupId }),
    supabase
      .from("group_questions")
      .select("slot_number, label_short")
      .eq("group_id", groupId)
      .order("slot_number"),
    supabase.from("platform_settings").select("resource_link_url, resource_link_label").single(),
    supabase.from("memberships").select("role").eq("group_id", groupId).eq("user_id", user.id).single(),
    supabase
      .from("memberships")
      .select("user_id, role, joined_at")
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("joined_at"),
  ]);
  const isAdmin = myMembership?.role === "admin";
  const userIds = memberships?.map((m) => m.user_id) ?? [];

  // Same idea: these three only depend on userIds/weekStart from above, not
  // on each other.
  const [{ data: profiles }, { data: checkIns }, { data: goals }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("*").in("id", userIds) : { data: [] },
    supabase.from("weekly_check_ins").select("*").eq("group_id", groupId).eq("week_start_date", weekStart!),
    userIds.length
      ? supabase
          .from("goals")
          .select("user_id, question_slot, goal_text")
          .eq("group_id", groupId)
          .in("user_id", userIds)
      : { data: [] },
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const checkInByUserId = new Map((checkIns ?? []).map((c) => [c.user_id, c]));

  const goalsByUserId = new Map<string, Record<number, string>>();
  for (const g of goals ?? []) {
    const forUser = goalsByUserId.get(g.user_id) ?? {};
    forUser[g.question_slot] = g.goal_text ?? "";
    goalsByUserId.set(g.user_id, forUser);
  }

  const columnLabels = [1, 2, 3, 4, 5].map((slot) => {
    const q = questions?.find((q) => q.slot_number === slot);
    return q ? shortColumnLabel(q.label_short) : "";
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[17px] text-neutral-500">{group.name}</p>
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
        <p className="text-[17px] text-neutral-500">Week of {weekStart}</p>
      </div>

      <GroupUpdateBar
        groupId={groupId}
        isAdmin={isAdmin}
        initialFlag={group.group_update_flag}
        groupLinkUrl={group.group_update_link_url}
        groupText={group.group_update_text}
        platformLinkUrl={platformSettings?.resource_link_url ?? null}
        platformLinkLabel={platformSettings?.resource_link_label ?? null}
      />

      <DashboardColumnHeaders labels={columnLabels} />

      <div className="space-y-2">
        {(memberships ?? []).map((m) => {
          const p = profileById.get(m.user_id);
          const c = checkInByUserId.get(m.user_id);
          const firstName = p?.first_name?.trim() || "Unnamed";
          const fullName = p
            ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed"
            : "Unnamed";

          return (
            <DashboardRow
              key={m.user_id}
              userId={m.user_id}
              checkInId={c?.id ?? null}
              firstName={firstName}
              fullName={fullName}
              imageUrl={p?.profile_image_url ?? null}
              initialsColor={p?.initials_circle_color ?? null}
              cellPhone={p?.cell_phone ?? null}
              ratings={
                c
                  ? [c.rating_1, c.rating_2, c.rating_3, c.rating_4, c.rating_5]
                  : [null, null, null, null, null]
              }
              prayerRequest={c?.prayer_request ?? null}
              reactionCounts={{
                heart: c?.reaction_heart_count ?? 0,
                pray: c?.reaction_pray_count ?? 0,
                thumbsup: c?.reaction_thumbsup_count ?? 0,
                praise: c?.reaction_praise_count ?? 0,
              }}
              goalsBySlot={goalsByUserId.get(m.user_id) ?? {}}
              columnLabels={columnLabels}
              isYou={m.user_id === user.id}
            />
          );
        })}
      </div>
    </div>
  );
}
