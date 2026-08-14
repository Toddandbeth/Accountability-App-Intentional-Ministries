import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardRow } from "@/components/DashboardRow";
import { DashboardColumnHeaders } from "@/components/DashboardColumnHeaders";
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
        <h1 className="text-xl font-semibold">Dashboard</h1>
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
  const { data: weekStart } = await supabase.rpc("current_week_start", { p_group_id: groupId });
  const { data: questions } = await supabase
    .from("group_questions")
    .select("slot_number, label_short")
    .eq("group_id", groupId)
    .order("slot_number");

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();
  const isAdmin = myMembership?.role === "admin";

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("joined_at");

  const userIds = memberships?.map((m) => m.user_id) ?? [];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds)
    : { data: [] };

  const { data: checkIns } = await supabase
    .from("weekly_check_ins")
    .select("*")
    .eq("group_id", groupId)
    .eq("week_start_date", weekStart!);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const checkInByUserId = new Map((checkIns ?? []).map((c) => [c.user_id, c]));

  const columnLabels = [1, 2, 3, 4, 5].map((slot) => {
    const q = questions?.find((q) => q.slot_number === slot);
    return q ? shortColumnLabel(q.label_short) : "";
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-neutral-500">{group?.name}</p>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-xs text-neutral-500">Week of {weekStart}</p>
      </div>

      <DashboardColumnHeaders labels={columnLabels} />

      <div className="space-y-2">
        {(memberships ?? []).map((m) => {
          const p = profileById.get(m.user_id);
          const c = checkInByUserId.get(m.user_id);
          const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed" : "Unnamed";

          return (
            <DashboardRow
              key={m.user_id}
              userId={m.user_id}
              name={name}
              ratings={c ? [c.rating_1, c.rating_2, c.rating_3, c.rating_4, c.rating_5] : [null, null, null, null, null]}
              prayerRequest={c?.prayer_request ?? null}
              isYou={m.user_id === user.id}
              isAdmin={isAdmin}
            />
          );
        })}
      </div>
    </div>
  );
}
