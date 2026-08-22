"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PRESET_COLORS = [
  "#253551", // brand navy
  "#7993c2", // brand periwinkle
  "#64748b", // slate
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#8b5cf6", // violet
];

interface InitialsColorPickerProps {
  userId: string;
  currentColor: string | null;
}

export function InitialsColorPicker({ userId, currentColor }: InitialsColorPickerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState<string | null>(null);

  async function choose(color: string | null) {
    setSaving(color ?? "none");
    await supabase.from("profiles").update({ initials_circle_color: color }).eq("id", userId);
    setSaving(null);
    router.refresh();
  }

  return (
    <div>
      <p className="mb-1 text-[17px] font-medium text-neutral-600">
        Circle color (used when you don&apos;t have a photo)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => choose(null)}
          disabled={saving !== null}
          title="Default"
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-brand-light text-[17px] text-brand-navy disabled:opacity-50 ${
            currentColor === null ? "border-brand-navy" : "border-transparent"
          }`}
        >
          ✕
        </button>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => choose(color)}
            disabled={saving !== null}
            title={color}
            style={{ backgroundColor: color }}
            className={`h-8 w-8 rounded-full border-2 disabled:opacity-50 ${
              currentColor === color ? "border-brand-navy" : "border-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
