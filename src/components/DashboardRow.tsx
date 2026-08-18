"use client";

import { useState } from "react";
import Link from "next/link";
import { ratingByValue } from "@/lib/ratings";
import { Avatar } from "@/components/Avatar";
import { ReactionButtons } from "@/components/ReactionButtons";

interface DashboardRowProps {
  userId: string;
  checkInId: string | null;
  firstName: string;
  fullName: string;
  imageUrl: string | null;
  cellPhone: string | null;
  ratings: (number | null)[]; // slot 1..5 in order
  prayerRequest: string | null;
  reactionCounts: {
    heart: number;
    pray: number;
    thumbsup: number;
    praise: number;
  };
  isYou: boolean;
}

export function DashboardRow({
  userId,
  checkInId,
  firstName,
  fullName,
  imageUrl,
  cellPhone,
  ratings,
  prayerRequest,
  reactionCounts,
  isYou,
}: DashboardRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 p-3 text-left"
      >
        <span className="flex w-24 shrink-0 items-center gap-1 overflow-hidden">
          <Avatar name={fullName} imageUrl={imageUrl} size={24} />
          <span className="truncate whitespace-nowrap text-sm font-medium">{firstName}</span>
          {prayerRequest?.trim() && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
              title="Submitted a Prayer & Life Update"
            />
          )}
        </span>
        <span className="flex flex-1 justify-end gap-1">
          {ratings.map((value, i) => {
            const r = ratingByValue(value);
            return (
              <span
                key={i}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[8px] font-bold"
                style={{
                  backgroundColor: r?.bg ?? "#e5e5e5",
                  color: r?.text ?? "#a3a3a3",
                }}
                title={r?.label ?? "No answer"}
              >
                {r ? r.label : "–"}
              </span>
            );
          })}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100">
          <div className="p-3">
            <p className="text-sm font-medium">
              {fullName}
              {isYou && <span className="ml-1 text-xs text-neutral-400">(you)</span>}
            </p>
            {cellPhone && (
              <p className="mt-0.5 text-xs text-neutral-500">
                <a href={`tel:${cellPhone}`} className="underline">
                  {cellPhone}
                </a>{" "}
                ·{" "}
                <a href={`sms:${cellPhone}`} className="underline">
                  Text
                </a>
              </p>
            )}
          </div>

          <div className="h-px bg-neutral-200" />

          <div className="p-3 text-sm">
            <p className="mb-1 text-xs font-semibold text-neutral-500">Prayer &amp; Life Update</p>
            <p className="text-neutral-700">
              {prayerRequest?.trim() ? prayerRequest : "No update submitted this week."}
            </p>
            <ReactionButtons checkInId={checkInId} counts={reactionCounts} />
            {!isYou && (
              <Link
                href={`/dashboard/member/${userId}`}
                className="mt-2 inline-block text-xs font-medium text-neutral-500 underline"
              >
                View last 6 weeks →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
