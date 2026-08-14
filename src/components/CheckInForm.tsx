"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RatingButtonRow } from "@/components/RatingButtonRow";
import type { GroupQuestion } from "@/lib/supabase/types";

interface CheckInFormProps {
  userId: string;
  groupId: string;
  weekStart: string;
  questions: GroupQuestion[];
  initialRatings: Record<number, number | null>;
  initialPrayerRequest: string;
  editable: boolean;
}

const RATING_COLUMNS = ["rating_1", "rating_2", "rating_3", "rating_4", "rating_5"] as const;

export function CheckInForm({
  userId,
  groupId,
  weekStart,
  questions,
  initialRatings,
  initialPrayerRequest,
  editable,
}: CheckInFormProps) {
  const supabase = createClient();

  const [ratings, setRatings] = useState(initialRatings);
  const [prayerRequest, setPrayerRequest] = useState(initialPrayerRequest);
  const [savedPrayerRequest, setSavedPrayerRequest] = useState(initialPrayerRequest);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [savingPrayer, setSavingPrayer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prayerJustSaved, setPrayerJustSaved] = useState(false);

  async function saveRating(slot: number, value: number) {
    setSaveError(null);
    setSavingSlot(slot);
    setRatings((prev) => ({ ...prev, [slot]: value }));

    const column = RATING_COLUMNS[slot - 1];
    const { error } = await supabase.from("weekly_check_ins").upsert(
      {
        user_id: userId,
        group_id: groupId,
        week_start_date: weekStart,
        [column]: value,
      },
      { onConflict: "user_id,group_id,week_start_date" }
    );

    setSavingSlot(null);
    if (error) setSaveError(error.message);
  }

  async function submitPrayerRequest() {
    setSaveError(null);
    setSavingPrayer(true);
    setPrayerJustSaved(false);

    const { error } = await supabase.from("weekly_check_ins").upsert(
      {
        user_id: userId,
        group_id: groupId,
        week_start_date: weekStart,
        prayer_request: prayerRequest || null,
      },
      { onConflict: "user_id,group_id,week_start_date" }
    );

    setSavingPrayer(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    setSavedPrayerRequest(prayerRequest);
    setPrayerJustSaved(true);
  }

  const prayerRequestDirty = prayerRequest !== savedPrayerRequest;

  return (
    <div className="space-y-4">
      {!editable && (
        <div className="rounded-lg bg-neutral-200 px-3 py-2 text-sm text-neutral-700">
          This week is locked. You can no longer edit your answers.
        </div>
      )}

      {questions.map((q) => (
        <div key={q.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-sm font-semibold">{q.label_short}</h3>
          <p className="mt-1 text-xs text-neutral-500">{q.label_description}</p>
          <div className="mt-3">
            <RatingButtonRow
              value={ratings[q.slot_number] ?? null}
              onChange={(value) => saveRating(q.slot_number, value)}
              disabled={!editable || savingSlot === q.slot_number}
            />
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold">Prayer request (optional)</h3>
        <textarea
          value={prayerRequest}
          onChange={(e) => {
            setPrayerRequest(e.target.value);
            setPrayerJustSaved(false);
          }}
          disabled={!editable}
          rows={3}
          placeholder="Anything the group can be praying for you this week?"
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={submitPrayerRequest}
            disabled={!editable || savingPrayer || !prayerRequestDirty}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingPrayer ? "Submitting…" : "Submit"}
          </button>
          {prayerJustSaved && !prayerRequestDirty && (
            <span className="text-xs text-neutral-500">Saved.</span>
          )}
        </div>
      </div>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
    </div>
  );
}
