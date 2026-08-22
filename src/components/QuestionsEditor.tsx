"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GroupQuestion } from "@/lib/supabase/types";

interface QuestionsEditorProps {
  groupId: string;
  questions: GroupQuestion[];
}

export function QuestionsEditor({ groupId, questions }: QuestionsEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  const [drafts, setDrafts] = useState(
    questions.map((q) => ({ id: q.id, label_short: q.label_short, label_description: q.label_description }))
  );
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, field: "label_short" | "label_description", value: string) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  async function saveAll() {
    setSaving(true);
    setError(null);

    const results = await Promise.all(
      drafts.map((d) =>
        supabase
          .from("group_questions")
          .update({ label_short: d.label_short, label_description: d.label_description })
          .eq("id", d.id)
      )
    );

    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setError(failed.error.message);
      return;
    }
    router.refresh();
  }

  async function resetToDefaults() {
    setResetting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("reset_group_questions", {
      p_group_id: groupId,
    });

    setResetting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-navy">Questions</h2>
        <button
          type="button"
          onClick={resetToDefaults}
          disabled={resetting}
          className="text-sm text-neutral-500 underline disabled:opacity-50"
        >
          {resetting ? "Resetting…" : "Reset to defaults"}
        </button>
      </div>

      {drafts.map((d, i) => (
        <div key={d.id} className="space-y-1 border-t border-neutral-100 pt-3 first:border-0 first:pt-0">
          <label className="block text-sm font-medium text-neutral-500">Question {i + 1} title</label>
          <input
            type="text"
            value={d.label_short}
            onChange={(e) => update(d.id, "label_short", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <label className="block text-sm font-medium text-neutral-500">Helper text</label>
          <textarea
            value={d.label_description}
            onChange={(e) => update(d.id, "label_description", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={saveAll}
        disabled={saving}
        className="w-full rounded-md bg-brand-navy py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save questions"}
      </button>
    </div>
  );
}
