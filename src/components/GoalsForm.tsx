"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GOAL_TEXT_MAX_LENGTH = 250;

interface GoalsFormProps {
  userId: string;
  groupId: string;
  questions: { slot_number: number; short_label: string }[];
  initialGoals: Record<number, string>;
}

export function GoalsForm({ userId, groupId, questions, initialGoals }: GoalsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [drafts, setDrafts] = useState<Record<number, string>>(initialGoals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  function update(slot: number, value: string) {
    setDrafts((prev) => ({ ...prev, [slot]: value.slice(0, GOAL_TEXT_MAX_LENGTH) }));
    setJustSaved(false);
  }

  async function saveAll() {
    setSaving(true);
    setError(null);

    const results = await Promise.all(
      questions.map((q) =>
        supabase.from("goals").upsert(
          {
            user_id: userId,
            group_id: groupId,
            question_slot: q.slot_number,
            goal_text: drafts[q.slot_number]?.trim() || null,
          },
          { onConflict: "user_id,group_id,question_slot" }
        )
      )
    );

    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setError(failed.error.message);
      return;
    }
    setJustSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-brand-navy">Your goals</h2>
      <p className="text-[17px] text-neutral-500">
        Optional, one per category. These don&apos;t reset each week — they stay until you change
        them.
      </p>

      {questions.map((q) => (
        <div
          key={q.slot_number}
          className="space-y-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
        >
          <label className="block text-[17px] font-bold text-brand-navy">{q.short_label}</label>
          <input
            type="text"
            value={drafts[q.slot_number] ?? ""}
            onChange={(e) => update(q.slot_number, e.target.value)}
            maxLength={GOAL_TEXT_MAX_LENGTH}
            placeholder="No goal set"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[17px]"
          />
        </div>
      ))}

      {error && <p className="text-[17px] text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save goals"}
        </button>
        {justSaved && <span className="text-[17px] text-neutral-500">Saved.</span>}
      </div>
    </div>
  );
}
