// Appending T00:00:00 forces Date to parse a plain "YYYY-MM-DD" string as
// local midnight rather than UTC midnight — without it, a date near a
// timezone boundary can display as the day before. Same pattern already
// used in GroupSettingsForm for the meeting-day-change confirmation.
export function formatMeetingDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
