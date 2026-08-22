import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WeekHistoryRow } from "@/components/WeekHistoryRow";

const HISTORY_WEEKS = 6;

export default async function MemberHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_group_id")
    .eq("id", user.id)
    .single();

  if (!profile?.active_group_id) return null;

  const groupId = profile.active_group_id;

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (myMembership?.status !== "active") {
    return (
      <div className="space-y-2">
        <Link href="/dashboard" className="text-[17px] text-neutral-500 underline">
          ← Back to dashboard
        </Link>
        <p className="text-[17px] text-neutral-600">
          Only active group members can view another member&apos;s history.
        </p>
      </div>
    );
  }

  // Independent of each other — none of these need another's result.
  const [{ data: memberProfile }, { data: weekStart }, { data: checkIns }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", userId).single(),
    supabase.rpc("current_week_start", { p_group_id: groupId }),
    supabase
      .from("weekly_check_ins")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false })
      .limit(HISTORY_WEEKS),
  ]);
  const name = memberProfile
    ? `${memberProfile.first_name ?? ""} ${memberProfile.last_name ?? ""}`.trim() || "Unnamed"
    : "Unnamed";

  return (
    <div className="space-y-4">
      <div>
        <Link href="/dashboard" className="text-[17px] text-neutral-500 underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-brand-navy">{name}&apos;s history</h1>
        <p className="text-[17px] text-neutral-500">Last {HISTORY_WEEKS} weeks.</p>
      </div>

      {(!checkIns || checkIns.length === 0) && (
        <p className="text-[17px] text-neutral-600">No check-ins yet for this member.</p>
      )}

      <div className="space-y-2">
        {(checkIns ?? []).map((c) => (
          <WeekHistoryRow
            key={c.id}
            weekStartDate={c.week_start_date}
            ratings={[c.rating_1, c.rating_2, c.rating_3, c.rating_4, c.rating_5]}
            prayerRequest={c.prayer_request}
            isCurrentWeek={c.week_start_date === weekStart}
            checkInId={c.id}
            reactionCounts={{
              heart: c.reaction_heart_count ?? 0,
              pray: c.reaction_pray_count ?? 0,
              thumbsup: c.reaction_thumbsup_count ?? 0,
              praise: c.reaction_praise_count ?? 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
