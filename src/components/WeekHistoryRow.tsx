import { ratingByValue } from "@/lib/ratings";
import { ReactionButtons } from "@/components/ReactionButtons";

interface WeekHistoryRowProps {
  weekStartDate: string;
  ratings: (number | null)[]; // slot 1..5 in order
  prayerRequest: string | null;
  isCurrentWeek: boolean;
  checkInId?: string | null;
  reactionCounts?: {
    heart: number;
    pray: number;
    thumbsup: number;
    praise: number;
  };
}

export function WeekHistoryRow({
  weekStartDate,
  ratings,
  prayerRequest,
  isCurrentWeek,
  checkInId,
  reactionCounts,
}: WeekHistoryRowProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-[17px] font-medium">
          Week of {weekStartDate}
          {isCurrentWeek && <span className="ml-1 text-[17px] text-neutral-400">(this week)</span>}
        </p>
      </div>
      <div className="mt-2 flex gap-1">
        {ratings.map((value, i) => {
          const r = ratingByValue(value);
          return (
            <span
              key={i}
              className="flex h-9 flex-1 items-center justify-center rounded-md text-xs font-bold"
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
      </div>
      {prayerRequest?.trim() && (
        <>
          <p className="mt-2 text-[17px] text-neutral-600">
            <span className="font-semibold text-neutral-500">Prayer &amp; Life Update: </span>
            {prayerRequest}
          </p>
          {reactionCounts && (
            <ReactionButtons checkInId={checkInId ?? null} counts={reactionCounts} />
          )}
        </>
      )}
    </div>
  );
}
