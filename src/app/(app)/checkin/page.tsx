import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import { CheckInForm } from "@/components/CheckInForm";

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
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="text-sm text-neutral-600">
          You&apos;re not part of a group yet. Create one, or join one with a code.
        </p>
        <CreateGroupForm />
        <JoinGroupForm />
      </div>
    );
  }

  const groupId = profile.active_group_id;

  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).single();
  const { data: questions } = await supabase
    .from("group_questions")
    .select("*")
    .eq("group_id", groupId)
    .order("slot_number");
  const { data: weekStart } = await supabase.rpc("current_week_start", { p_group_id: groupId });
  const { data: editable } = await supabase.rpc("is_week_editable", {
    p_group_id: groupId,
    p_week_start: weekStart!,
  });
  const { data: checkIn } = await supabase
    .from("weekly_check_ins")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart!)
    .maybeSingle();

  const initialRatings = {
    1: checkIn?.rating_1 ?? null,
    2: checkIn?.rating_2 ?? null,
    3: checkIn?.rating_3 ?? null,
    4: checkIn?.rating_4 ?? null,
    5: checkIn?.rating_5 ?? null,
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-neutral-500">{group?.name}</p>
        <h1 className="text-xl font-semibold">This week&apos;s check-in</h1>
      </div>

      <CheckInForm
        userId={user.id}
        groupId={groupId}
        weekStart={weekStart!}
        questions={questions ?? []}
        initialRatings={initialRatings}
        initialPrayerRequest={checkIn?.prayer_request ?? ""}
        editable={Boolean(editable)}
      />
    </div>
  );
}
