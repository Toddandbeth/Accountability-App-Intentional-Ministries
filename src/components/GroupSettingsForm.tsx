"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COMMON_TIMEZONES, MEETING_DAYS } from "@/lib/timezones";
import { weekdayName } from "@/lib/weekdays";
import type { Group } from "@/lib/supabase/types";

interface GroupSettingsFormProps {
  group: Group;
}

export function GroupSettingsForm({ group }: GroupSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [timezone, setTimezone] = useState(group.timezone);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);

  const [meetingDay, setMeetingDay] = useState(group.meeting_day);
  const [savingDay, setSavingDay] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [lockDateMessage, setLockDateMessage] = useState<string | null>(null);

  async function saveTimezone() {
    setSavingTimezone(true);
    setTimezoneError(null);

    const { error } = await supabase.from("groups").update({ timezone }).eq("id", group.id);

    setSavingTimezone(false);
    if (error) {
      setTimezoneError(error.message);
      return;
    }
    router.refresh();
  }

  async function saveMeetingDay() {
    setSavingDay(true);
    setDayError(null);
    setLockDateMessage(null);

    const { data: lockDate, error } = await supabase.rpc("set_group_meeting_day", {
      p_group_id: group.id,
      p_new_day: meetingDay,
    });

    setSavingDay(false);
    if (error) {
      setDayError(error.message);
      return;
    }

    if (lockDate) {
      const formatted = new Date(`${lockDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      setLockDateMessage(`Your current week will now lock on ${formatted}.`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Meeting day</h2>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Time zone</label>
        <div className="flex gap-2">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {COMMON_TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={saveTimezone}
            disabled={savingTimezone || timezone === group.timezone}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingTimezone ? "…" : "Save"}
          </button>
        </div>
        {timezoneError && <p className="mt-1 text-sm text-red-600">{timezoneError}</p>}
      </div>

      <p className="text-xs text-neutral-500">
        Currently {weekdayName(group.meeting_day)}. Changing this applies immediately to the week
        already in progress, extending it to land on the new day — always at least 7 full days
        out, never shorter.
      </p>
      <p className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
        Changing this updates your group&apos;s regular schedule going forward, and may lengthen
        the week currently in progress (it will never shorten it). Only use this for a lasting
        change to your meeting day — not to move or skip a single week&apos;s meeting.
      </p>
      <div className="flex gap-2">
        <select
          value={meetingDay}
          onChange={(e) => {
            setMeetingDay(Number(e.target.value));
            setLockDateMessage(null);
          }}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {MEETING_DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={saveMeetingDay}
          disabled={savingDay || meetingDay === group.meeting_day}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingDay ? "…" : "Change"}
        </button>
      </div>
      {dayError && <p className="text-sm text-red-600">{dayError}</p>}
      {lockDateMessage && <p className="text-sm text-neutral-700">{lockDateMessage}</p>}
    </div>
  );
}
