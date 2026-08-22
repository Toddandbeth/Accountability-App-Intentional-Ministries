"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COMMON_TIMEZONES, MEETING_DAYS, guessTimezone } from "@/lib/timezones";

export function CreateGroupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [meetingDay, setMeetingDay] = useState(1); // Monday default
  const [timezone, setTimezone] = useState(guessTimezone());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: rpcError } = await supabase.rpc("create_group", {
      p_name: name,
      p_meeting_day: meetingDay,
      p_timezone: timezone,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-brand-navy">Create a group</h2>
      <p className="mt-1 text-[17px] text-neutral-600">
        You&apos;ll be the group&apos;s admin. Share the group code with the men you want in it.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />

        <div>
          <label className="mb-1 block text-[17px] font-medium text-neutral-600">Meeting day</label>
          <select
            value={meetingDay}
            onChange={(e) => setMeetingDay(Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
          >
            {MEETING_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[17px] font-medium text-neutral-600">Time zone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
          >
            {COMMON_TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-[17px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-navy py-2 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create group"}
        </button>
      </form>
    </div>
  );
}
