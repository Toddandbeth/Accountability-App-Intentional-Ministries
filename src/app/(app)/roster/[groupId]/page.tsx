import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import type { GroupBasicInfo, GroupRosterMember } from "@/lib/supabase/types";

export default async function GroupRosterPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: groupInfoData } = await supabase
    .rpc("get_group_basic_info", { p_group_id: groupId })
    .single();
  const groupInfo = groupInfoData as GroupBasicInfo | null;

  if (!groupInfo || groupInfo.is_active) {
    return (
      <div className="space-y-2">
        <Link href="/settings" className="text-sm text-neutral-500 underline">
          ← Back to settings
        </Link>
        <p className="text-sm text-neutral-600">
          That roster isn&apos;t available — the group either isn&apos;t deactivated, or you were
          never a member of it.
        </p>
      </div>
    );
  }

  const { data: rosterData } = await supabase.rpc("get_group_roster", { p_group_id: groupId });
  const roster = (rosterData ?? []) as GroupRosterMember[];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/settings" className="text-sm text-neutral-500 underline">
          ← Back to settings
        </Link>
        <h1 className="text-2xl font-bold text-brand-navy">{groupInfo.name}</h1>
        <p className="text-sm text-neutral-500">
          This group is no longer active. Here&apos;s who was part of it — no weekly content, just
          who was there.
        </p>
      </div>

      <div className="space-y-2">
        {roster.map((m) => {
          const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unnamed";
          return (
            <div
              key={m.user_id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
            >
              <Avatar
                name={name}
                imageUrl={m.profile_image_url}
                initialsColor={m.initials_circle_color}
                size={32}
              />
              <span className="text-sm font-medium">
                {name}
                {m.user_id === user.id && (
                  <span className="ml-1 text-sm text-neutral-400">(you)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
