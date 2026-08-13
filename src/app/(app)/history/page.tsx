import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WeekHistoryRow } from "@/components/WeekHistoryRow";

const HISTORY_WEEKS = 10;

export default async function HistoryPage() {
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

  if (!profile?.active_group_id) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Your history</h1>
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

  const { data: weekStart } = await supabase.rpc("current_week_start", { p_group_id: groupId });

  const { data: checkIns } = await supabase
    .from("weekly_check_ins")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false })
    .limit(HISTORY_WEEKS);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/checkin" className="text-sm text-neutral-500 underline">
          ← Back to check-in
        </Link>
        <h1 className="text-xl font-semibold">Your history</h1>
      </div>

      {(!checkIns || checkIns.length === 0) && (
        <p className="text-sm text-neutral-600">
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
          />
        ))}
      </div>
    </div>
  );
}
