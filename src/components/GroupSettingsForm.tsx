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

  const [name, setName] = useState(group.name);
  const [timezone, setTimezone] = useState(group.timezone);
  const [resourceUrl, setResourceUrl] = useState(group.resource_link_url ?? "");
  const [resourceLabel, setResourceLabel] = useState(group.resource_link_label ?? "");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [meetingDay, setMeetingDay] = useState(group.meeting_day);
  const [savingDay, setSavingDay] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoError(null);

    const { error } = await supabase
      .from("groups")
      .update({
        name,
        timezone,
        resource_link_url: resourceUrl || null,
        resource_link_label: resourceLabel || null,
      })
      .eq("id", group.id);

    setSavingInfo(false);
    if (error) {
      setInfoError(error.message);
      return;
    }
    router.refresh();
  }

  async function saveMeetingDay() {
    setSavingDay(true);
    setDayError(null);

    const { error } = await supabase.rpc("set_group_meeting_day", {
      p_group_id: group.id,
      p_new_day: meetingDay,
    });

    setSavingDay(false);
    if (error) {
      setDayError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={saveInfo} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Group info</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Time zone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {COMMON_TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Resource link (shown to the group)
          </label>
          <input
            type="text"
            placeholder="Label, e.g. This month's challenge"
            value={resourceLabel}
            onChange={(e) => setResourceLabel(e.target.value)}
            className="mb-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="url"
            placeholder="https://..."
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {infoError && <p className="text-sm text-red-600">{infoError}</p>}

        <button
          type="submit"
          disabled={savingInfo}
          className="w-full rounded-md bg-neutral-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingInfo ? "Saving…" : "Save"}
        </button>
      </form>

      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Meeting day</h2>
        <p className="text-xs text-neutral-500">
          Currently {weekdayName(group.meeting_day)}. Changing this never affects the
          in-progress week — it takes effect starting the week after this one locks.
        </p>
        {group.pending_meeting_day !== null && (
          <p className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
            A change to {weekdayName(group.pending_meeting_day)} is scheduled to take effect
            after this week locks.
          </p>
        )}
        <div className="flex gap-2">
          <select
            value={meetingDay}
            onChange={(e) => setMeetingDay(Number(e.target.value))}
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
            disabled={
              savingDay ||
              (meetingDay === group.meeting_day && group.pending_meeting_day === null)
            }
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingDay ? "…" : "Change"}
          </button>
        </div>
        {dayError && <p className="text-sm text-red-600">{dayError}</p>}
      </div>
    </div>
  );
}
