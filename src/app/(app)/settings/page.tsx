import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <p className="font-medium">
          {profile?.first_name} {profile?.last_name}
        </p>
        <p className="text-neutral-500">{profile?.email}</p>
      </div>

      <p className="text-sm text-neutral-600">
        Profile editing, group switching, and per-group settings are coming in the next
        milestone.
      </p>

      <LogoutButton />
    </div>
  );
}
