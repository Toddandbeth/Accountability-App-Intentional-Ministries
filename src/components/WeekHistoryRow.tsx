import { ratingByValue } from "@/lib/ratings";

interface WeekHistoryRowProps {
  weekStartDate: string;
  ratings: (number | null)[]; // slot 1..5 in order
  prayerRequest: string | null;
  isCurrentWeek: boolean;
}

export function WeekHistoryRow({
  weekStartDate,
  ratings,
  prayerRequest,
  isCurrentWeek,
}: WeekHistoryRowProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Week of {weekStartDate}
          {isCurrentWeek && <span className="ml-1 text-xs text-neutral-400">(this week)</span>}
        </p>
      </div>
      <div className="mt-2 flex gap-1">
        {ratings.map((value, i) => {
          const r = ratingByValue(value);
          return (
            <span
              key={i}
              className="flex h-9 flex-1 items-center justify-center rounded-md text-[10px] font-bold"
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
        <p className="mt-2 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-500">Prayer request: </span>
          {prayerRequest}
        </p>
      )}
    </div>
  );
}
