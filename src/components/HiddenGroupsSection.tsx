"use client";

import { useState } from "react";
import { HideGroupToggle } from "@/components/HideGroupToggle";

interface HiddenGroupsSectionProps {
  groups: { id: string; name: string; membershipId: string }[];
}

export function HiddenGroupsSection({ groups }: HiddenGroupsSectionProps) {
  const [open, setOpen] = useState(false);

  if (groups.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-neutral-500 underline"
      >
        {open ? "Hide" : "Show"} Hidden Groups ({groups.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {groups.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-500"
            >
              <span className="flex-1">{g.name}</span>
              <HideGroupToggle membershipId={g.membershipId} hidden />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
