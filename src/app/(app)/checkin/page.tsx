import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import { CheckInForm } from "@/components/CheckInForm";
import { OnboardingExplainer } from "@/components/OnboardingExplainer";

export default async function CheckInPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware guarantees this won't happen

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.active_group_id) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-brand-navy">Welcome</h1>
        <p className="text-sm text-neutral-600">
          You&apos;re not part of a group yet. Create one, or join one with a code.
        </p>
        <OnboardingExplainer />
        <CreateGroupForm />
        <JoinGroupForm />
      </div>
    );
  }

  const groupId = profile.active_group_id;

  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).single();

  if (!group) {
    // active_group_id points at a group RLS no longer lets us read —
    // the membership was removed. Not the "no group at all" empty state.
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-brand-navy">No longer a member</h1>
        <p className="text-sm text-neutral-600">
          You&apos;re no longer an active member of that group.{" "}
          <Link href="/settings" className="underline">
            Switch groups or join another
          </Link>
          .
        </p>
      </div>
    );
  }

  // Independent of each other — only editable/checkIn below actually need
  // weekStart's value.
  const [{ data: questions }, { data: weekStart }, { data: myGoals }] = await Promise.all([
    supabase.from("group_questions").select("*").eq("group_id", groupId).order("slot_number"),
    supabase.rpc("current_week_start", { p_group_id: groupId }),
    supabase
      .from("goals")
      .select("question_slot, goal_text")
      .eq("group_id", groupId)
      .eq("user_id", user.id),
  ]);

  const [{ data: editable }, { data: checkIn }] = await Promise.all([
    supabase.rpc("is_week_editable", { p_group_id: groupId, p_week_start: weekStart! }),
    supabase
      .from("weekly_check_ins")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("week_start_date", weekStart!)
      .maybeSingle(),
  ]);

  const initialRatings = {
    1: checkIn?.rating_1 ?? null,
    2: checkIn?.rating_2 ?? null,
    3: checkIn?.rating_3 ?? null,
    4: checkIn?.rating_4 ?? null,
    5: checkIn?.rating_5 ?? null,
  };

  const goalsQuestions = (questions ?? []).map((q) => ({
    slot_number: q.slot_number,
    label_short: q.label_short,
  }));
  const initialGoals = Object.fromEntries(
    (myGoals ?? []).map((g) => [g.question_slot, g.goal_text ?? ""])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{group?.name}</p>
          <h1 className="text-2xl font-bold text-brand-navy">This week&apos;s check-in</h1>
        </div>
        <Link href="/history" className="mt-1 text-sm text-neutral-500 underline">
          Your history
        </Link>
      </div>

      <CheckInForm
        userId={user.id}
        groupId={groupId}
        weekStart={weekStart!}
        questions={questions ?? []}
        initialRatings={initialRatings}
        initialPrayerRequest={checkIn?.prayer_request ?? ""}
        editable={Boolean(editable)}
        goalsQuestions={goalsQuestions}
        initialGoals={initialGoals}
      />
    </div>
  );
}
