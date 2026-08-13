import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ActiveGroupSwitcher } from "@/components/ActiveGroupSwitcher";
import { JoinGroupForm } from "@/components/JoinGroupForm";

export default async function SettingsPage() {
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

  const { data: memberships } = await supabase
    .from("memberships")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const groupIds = memberships?.map((m) => m.group_id) ?? [];
  const { data: groups } = groupIds.length
    ? await supabase.from("groups").select("id, name").in("id", groupIds)
    : { data: [] };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <p className="font-medium">
          {profile?.first_name} {profile?.last_name}
        </p>
        <p className="text-neutral-500">{profile?.email}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">Your groups</h2>
        <ActiveGroupSwitcher
          userId={user.id}
          groups={groups ?? []}
          activeGroupId={profile?.active_group_id ?? null}
        />
      </div>

      <JoinGroupForm />

      <p className="text-sm text-neutral-600">
        Profile editing and per-group settings are coming in the next milestone.
      </p>

      <LogoutButton />
    </div>
  );
}
