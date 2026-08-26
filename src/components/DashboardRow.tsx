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
  initialsColor: string | null;
  cellPhone: string | null;
  ratings: (number | null)[]; // slot 1..5 in order
  prayerRequest: string | null;
  reactionCounts: {
    heart: number;
    pray: number;
    thumbsup: number;
    praise: number;
  };
  goalsBySlot: Record<number, string>;
  columnLabels: string[]; // slot 1..5 in order
  isYou: boolean;
}

export function DashboardRow({
  userId,
  checkInId,
  firstName,
  fullName,
  imageUrl,
  initialsColor,
  cellPhone,
  ratings,
  prayerRequest,
  reactionCounts,
  goalsBySlot,
  columnLabels,
  isYou,
}: DashboardRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        <span className="relative shrink-0">
          <Avatar name={fullName} imageUrl={imageUrl} size={40} initialsColor={initialsColor} />
          {prayerRequest?.trim() && (
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brand-periwinkle ring-2 ring-white"
              title="Submitted a Prayer & Life Update"
            />
          )}
        </span>
        <span className="flex flex-1 gap-1">
          {ratings.map((value, i) => {
            const r = ratingByValue(value);
            return (
              <span
                key={i}
                className="flex h-11 flex-1 items-center justify-center rounded-md text-xs font-bold"
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
            <p className="text-[17px] font-medium text-brand-navy">
              {fullName}
              {isYou && <span className="ml-1 text-[17px] text-neutral-400">(you)</span>}
            </p>
            {cellPhone && (
              <p className="mt-0.5 text-[17px] text-neutral-500">
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

          <div className="p-3 text-[17px]">
            <p className="mb-1 text-[17px] font-semibold text-neutral-500">Prayer &amp; Life Update</p>
            <p className="text-neutral-700">
              {prayerRequest?.trim() ? prayerRequest : "No update submitted this week."}
            </p>
            <ReactionButtons checkInId={checkInId} counts={reactionCounts} />
          </div>

          <div className="h-px bg-neutral-200" />

          <div className="p-3 text-[17px]">
            <Link
              href={isYou ? "/history" : `/dashboard/member/${userId}`}
              className="inline-block text-[17px] font-medium text-brand-periwinkle underline"
            >
              {isYou ? "Your Full History" : "6-Week History"}
            </Link>
          </div>

          <div className="h-px bg-neutral-200" />

          <div className="p-3 text-[17px]">
            <button
              type="button"
              onClick={() => setGoalsExpanded((v) => !v)}
              className="text-[17px] font-medium text-brand-periwinkle underline"
            >
              {goalsExpanded ? "Hide" : "See"} {firstName}&apos;s Goals
            </button>
            {goalsExpanded && (
              <div className="mt-2 space-y-2">
                {columnLabels.map((label, i) => {
                  const slot = i + 1;
                  const text = goalsBySlot[slot]?.trim();
                  return (
                    <div key={slot} className="rounded-lg border border-neutral-100 bg-neutral-50 p-2">
                      <p className="text-[17px] font-bold text-brand-navy">{label}</p>
                      <p className="text-neutral-700">{text || "No goal set."}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
