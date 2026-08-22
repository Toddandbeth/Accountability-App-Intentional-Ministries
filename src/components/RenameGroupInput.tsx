"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RenameGroupInputProps {
  groupId: string;
  currentName: string;
  onDone: () => void;
}

// Always renders in "editing" mode — the parent decides when to show this
// in place of the normal switch-button row, so the two never render at
// once and fight for space.
export function RenameGroupInput({ groupId, currentName, onDone }: RenameGroupInputProps) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("groups")
      .update({ name: trimmed })
      .eq("id", groupId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onDone();
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-[17px]"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim()}
          className="shrink-0 rounded-md bg-brand-navy px-3 py-1.5 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-[17px] text-neutral-500"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-[17px] text-red-600">{error}</p>}
    </div>
  );
}
