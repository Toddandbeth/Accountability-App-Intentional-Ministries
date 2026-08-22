"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HideGroupToggle } from "@/components/HideGroupToggle";
import { RenameGroupInput } from "@/components/RenameGroupInput";

interface ActiveGroupSwitcherProps {
  userId: string;
  groups: { id: string; name: string; membershipId: string; isDeactivated?: boolean }[];
  activeGroupId: string | null;
  canRenameActive?: boolean;
}

export function ActiveGroupSwitcher({
  userId,
  groups,
  activeGroupId,
  canRenameActive,
}: ActiveGroupSwitcherProps) {
  const router = useRouter();
  const supabase = createClient();
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  async function switchTo(groupId: string) {
    if (groupId === activeGroupId) return;
    setSwitching(groupId);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_group_id: groupId })
      .eq("id", userId);

    setSwitching(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  if (groups.length === 0) {
    return <p className="text-sm text-neutral-600">You&apos;re not part of any groups yet.</p>;
  }

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const isActive = g.id === activeGroupId;

        if (isActive && renaming) {
          return (
            <div
              key={g.id}
              className="rounded-lg border border-brand-navy bg-neutral-50 p-3 text-sm"
            >
              <RenameGroupInput
                groupId={g.id}
                currentName={g.name}
                onDone={() => setRenaming(false)}
              />
            </div>
          );
        }

        return (
          <div
            key={g.id}
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              isActive ? "border-brand-navy bg-neutral-50" : "border-neutral-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => switchTo(g.id)}
              disabled={switching === g.id}
              className="flex flex-1 items-center justify-between text-left disabled:opacity-50"
            >
              <span className={isActive ? "font-semibold text-brand-navy" : ""}>{g.name}</span>
              {isActive && (
                <span className="text-sm font-semibold text-brand-periwinkle">Active</span>
              )}
            </button>
            {isActive && canRenameActive && (
              <button
                type="button"
                onClick={() => setRenaming(true)}
                title="Rename group"
                className="shrink-0 text-sm text-neutral-400"
              >
                ✎
              </button>
            )}
            {g.isDeactivated && (
              <Link
                href={`/roster/${g.id}`}
                className="shrink-0 text-sm font-medium text-neutral-500 underline"
              >
                Roster
              </Link>
            )}
            {/* An active group can't be hidden — switch to a different one
                first, so it's never both the active group and sitting in
                the hidden list at once. */}
            {!isActive && <HideGroupToggle membershipId={g.membershipId} hidden={false} />}
          </div>
        );
      })}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
