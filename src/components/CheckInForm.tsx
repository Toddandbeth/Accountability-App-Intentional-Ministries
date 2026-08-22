"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RatingButtonRow } from "@/components/RatingButtonRow";
import { GoalsForm } from "@/components/GoalsForm";
import type { GroupQuestion } from "@/lib/supabase/types";

interface CheckInFormProps {
  userId: string;
  groupId: string;
  weekStart: string;
  questions: GroupQuestion[];
  initialRatings: Record<number, number | null>;
  initialPrayerRequest: string;
  editable: boolean;
  goalsQuestions: { slot_number: number; label_short: string }[];
  initialGoals: Record<number, string>;
}

const RATING_COLUMNS = ["rating_1", "rating_2", "rating_3", "rating_4", "rating_5"] as const;
const PRAYER_REQUEST_MAX_LENGTH = 500;
const SHOW_DESCRIPTIONS_KEY = "showQuestionDescriptions";

export function CheckInForm({
  userId,
  groupId,
  weekStart,
  questions,
  initialRatings,
  initialPrayerRequest,
  editable,
  goalsQuestions,
  initialGoals,
}: CheckInFormProps) {
  const supabase = createClient();

  const [ratings, setRatings] = useState(initialRatings);
  const [prayerRequest, setPrayerRequest] = useState(initialPrayerRequest);
  const [savedPrayerRequest, setSavedPrayerRequest] = useState(initialPrayerRequest);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [savingPrayer, setSavingPrayer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prayerJustSaved, setPrayerJustSaved] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(true);
  // Deliberately plain state, no persistence — the goals section starts
  // collapsed every time this screen mounts, even if it was open moments
  // ago, since goals change far less often than the weekly rating/update.
  const [goalsOpen, setGoalsOpen] = useState(false);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) after mount, so this
    // can't be lazy initial state without a server/client render mismatch.
    const stored = localStorage.getItem(SHOW_DESCRIPTIONS_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setShowDescriptions(stored === "true");
  }, []);

  function toggleDescriptions() {
    setShowDescriptions((prev) => {
      const next = !prev;
      localStorage.setItem(SHOW_DESCRIPTIONS_KEY, String(next));
      return next;
    });
  }

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
        <div className="rounded-lg bg-neutral-200 px-3 py-2 text-[17px] text-neutral-700">
          This week is locked. You can no longer edit your answers.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleDescriptions}
          className="text-[17px] text-neutral-500 underline"
        >
          {showDescriptions ? "Hide descriptions" : "Show descriptions"}
        </button>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-xl font-semibold text-brand-navy">{q.label_short}</h3>
          {showDescriptions && (
            <p className="mt-1 text-[17px] text-neutral-500">{q.label_description}</p>
          )}
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
        <h3 className="text-xl font-semibold text-brand-navy">Prayer &amp; Life Update (optional)</h3>
        <textarea
          value={prayerRequest}
          onChange={(e) => {
            setPrayerRequest(e.target.value.slice(0, PRAYER_REQUEST_MAX_LENGTH));
            setPrayerJustSaved(false);
          }}
          disabled={!editable}
          rows={3}
          maxLength={PRAYER_REQUEST_MAX_LENGTH}
          placeholder="A prayer request, a praise, or a quick update on one of the categories above."
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px] disabled:opacity-50"
        />
        <div className="mt-1 text-right text-[17px] text-neutral-400">
          {prayerRequest.length}/{PRAYER_REQUEST_MAX_LENGTH}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submitPrayerRequest}
            disabled={!editable || savingPrayer || !prayerRequestDirty}
            className="rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white disabled:opacity-50"
          >
            {savingPrayer ? "Submitting…" : "Submit"}
          </button>
          {prayerJustSaved && !prayerRequestDirty && (
            <span className="text-[17px] text-neutral-500">Saved.</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setGoalsOpen((v) => !v)}
        className="w-full rounded-xl bg-brand-periwinkle p-4 text-left text-[17px] font-bold text-white"
      >
        {goalsOpen ? "Hide Your Goals" : "Manage Your Goals"}
      </button>
      {goalsOpen && (
        <GoalsForm
          userId={userId}
          groupId={groupId}
          questions={goalsQuestions}
          initialGoals={initialGoals}
        />
      )}

      {saveError && <p className="text-[17px] text-red-600">{saveError}</p>}
    </div>
  );
}
