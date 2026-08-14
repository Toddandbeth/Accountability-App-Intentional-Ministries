"use client";

import { useState } from "react";
import { ratingByValue } from "@/lib/ratings";

interface DashboardRowProps {
  name: string;
  ratings: (number | null)[]; // slot 1..5 in order
  prayerRequest: string | null;
  isYou: boolean;
}

export function DashboardRow({ name, ratings, prayerRequest, isYou }: DashboardRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {name}
            {isYou && <span className="ml-1 text-xs text-neutral-400">(you)</span>}
          </span>
          {prayerRequest?.trim() && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
              title="Submitted a Prayer & Life Update"
            />
          )}
        </span>
        <span className="flex gap-1">
          {ratings.map((value, i) => {
            const r = ratingByValue(value);
            return (
              <span
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[9px] font-bold"
                style={{
                  backgroundColor: r?.bg ?? "#e5e5e5",
                  color: r?.text ?? "#a3a3a3",
                }}
                title={r?.label ?? "No answer"}
              >
                {r ? r.label[0] : "–"}
              </span>
            );
          })}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold text-neutral-500">Prayer &amp; Life Update</p>
          <p className="text-neutral-700">
            {prayerRequest?.trim() ? prayerRequest : "No update submitted this week."}
          </p>
        </div>
      )}
    </div>
  );
}
