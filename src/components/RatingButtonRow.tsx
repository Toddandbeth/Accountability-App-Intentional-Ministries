"use client";

import { RATING_SCALE } from "@/lib/ratings";

interface RatingButtonRowProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RatingButtonRow({ value, onChange, disabled }: RatingButtonRowProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {RATING_SCALE.map((r) => {
        const selected = value === r.value;
        return (
          <button
            key={r.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.value)}
            className="flex flex-col items-center justify-center rounded-lg py-3 text-[15px] font-semibold transition disabled:opacity-50"
            style={{
              backgroundColor: r.bg,
              color: r.text,
              border: selected ? "3px solid #000000" : "3px solid transparent",
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
