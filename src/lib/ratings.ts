// The 5-point rating scale, in the display order specified by the blueprint:
// Strong, Good, Okay, Weak, Help (left to right), values 5 down to 1.
export const RATING_SCALE = [
  { value: 5, label: "Strong", bg: "#1b7a3d", text: "#ffffff" }, // dark green
  { value: 4, label: "Good", bg: "#8fce6b", text: "#1a1a1a" }, // light green
  { value: 3, label: "Okay", bg: "#f4d03f", text: "#1a1a1a" }, // yellow
  { value: 2, label: "Weak", bg: "#e88a2e", text: "#1a1a1a" }, // orange
  { value: 1, label: "Help", bg: "#d64545", text: "#ffffff" }, // red
] as const;

export type RatingValue = (typeof RATING_SCALE)[number]["value"];

export function ratingByValue(value: number | null | undefined) {
  return RATING_SCALE.find((r) => r.value === value) ?? null;
}
