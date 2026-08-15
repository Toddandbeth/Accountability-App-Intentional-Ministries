import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ActiveGroupSwitcher } from "@/components/ActiveGroupSwitcher";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { ProfileForm } from "@/components/ProfileForm";

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

      <p className="text-sm text-neutral-500">{profile?.email}</p>

      {profile && <ProfileForm profile={profile} />}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700">Your groups</h2>
        <ActiveGroupSwitcher
          userId={user.id}
          groups={groups ?? []}
          activeGroupId={profile?.active_group_id ?? null}
        />
      </div>

      <JoinGroupForm />
      <CreateGroupForm />

      <LogoutButton />
    </div>
  );
}
