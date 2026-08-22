"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const REACTIONS = [
  { key: "heart", emoji: "❤️", label: "Heart" },
  { key: "pray", emoji: "🙏", label: "Pray" },
  { key: "thumbsup", emoji: "👍", label: "Thumbs up" },
  { key: "praise", emoji: "🙌", label: "Praise" },
] as const;

type ReactionKey = (typeof REACTIONS)[number]["key"];

interface ReactionButtonsProps {
  checkInId: string | null;
  counts: Record<ReactionKey, number>;
}

export function ReactionButtons({ checkInId, counts: initialCounts }: ReactionButtonsProps) {
  const supabase = createClient();
  const [counts, setCounts] = useState(initialCounts);
  const [busy, setBusy] = useState<ReactionKey | null>(null);

  async function react(key: ReactionKey) {
    if (!checkInId || busy) return;

    setBusy(key);
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));

    const { error } = await supabase.rpc("increment_reaction", {
      p_checkin_id: checkInId,
      p_reaction: key,
    });

    setBusy(null);

    if (error) {
      setCounts((prev) => ({ ...prev, [key]: prev[key] - 1 }));
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      {REACTIONS.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => react(r.key)}
          disabled={!checkInId || busy === r.key}
          title={r.label}
          className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-sm disabled:opacity-40"
        >
          <span>{r.emoji}</span>
          <span className="text-sm font-medium text-neutral-600">{counts[r.key]}</span>
        </button>
      ))}
    </div>
  );
}
