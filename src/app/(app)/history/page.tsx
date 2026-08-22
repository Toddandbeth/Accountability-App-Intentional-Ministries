import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WeekHistoryRow } from "@/components/WeekHistoryRow";
import type { GroupBasicInfo } from "@/lib/supabase/types";

const HISTORY_WEEKS = 10;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group: groupParam } = await searchParams;
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

  const groupId = groupParam || profile?.active_group_id;

  if (!groupId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-brand-navy">Your history</h1>
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

  // Own historical check-ins remain readable regardless of current
  // membership status in this group, so past/removed groups are looked up
  // via this narrow RPC rather than a direct groups-table read. All three
  // of these only depend on groupId/user.id, not on each other — checkIns
  // doesn't actually need groupInfo or weekStart to run, so there's no
  // reason to wait for those first.
  const [{ data: groupInfoData }, { data: weekStart }, { data: checkIns }] = await Promise.all([
    supabase.rpc("get_group_basic_info", { p_group_id: groupId }).single(),
    supabase.rpc("current_week_start", { p_group_id: groupId }),
    supabase
      .from("weekly_check_ins")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .order("week_start_date", { ascending: false })
      .limit(HISTORY_WEEKS),
  ]);
  const groupInfo = groupInfoData as GroupBasicInfo | null;

  if (!groupInfo) {
    return (
      <div className="space-y-2">
        <Link href="/settings" className="text-[17px] text-neutral-500 underline">
          ← Back to settings
        </Link>
        <p className="text-[17px] text-neutral-600">You don&apos;t have history for that group.</p>
      </div>
    );
  }

  const isCurrentlyActiveGroup = groupId === profile?.active_group_id;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={isCurrentlyActiveGroup ? "/checkin" : "/settings"}
          className="text-[17px] text-neutral-500 underline"
        >
          {isCurrentlyActiveGroup ? "← Back to check-in" : "← Back to settings"}
        </Link>
        <h1 className="text-2xl font-bold text-brand-navy">Your history</h1>
        <p className="text-[17px] text-neutral-500">{groupInfo.name}</p>
      </div>

      {(!checkIns || checkIns.length === 0) && (
        <p className="text-[17px] text-neutral-600">
          No check-ins yet — they&apos;ll show up here once you submit your first one.
        </p>
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
