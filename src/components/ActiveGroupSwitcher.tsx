"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ActiveGroupSwitcherProps {
  userId: string;
  groups: { id: string; name: string }[];
  activeGroupId: string | null;
}

export function ActiveGroupSwitcher({ userId, groups, activeGroupId }: ActiveGroupSwitcherProps) {
  const router = useRouter();
  const supabase = createClient();
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => switchTo(g.id)}
            disabled={switching === g.id}
            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm disabled:opacity-50 ${
              isActive ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white"
            }`}
          >
            <span>{g.name}</span>
            {isActive && <span className="text-xs font-semibold text-neutral-500">Active</span>}
          </button>
        );
      })}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
