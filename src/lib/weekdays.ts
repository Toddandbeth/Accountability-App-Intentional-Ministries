export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayName(day: number): string {
  return WEEKDAY_NAMES[day] ?? "Unknown";
}
