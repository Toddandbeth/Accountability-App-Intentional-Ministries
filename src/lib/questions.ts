// Derives a short dashboard-column label from a question's title. Handles
// the default "Category — Description" format (e.g. "God — My Daily Walk
// with God" -> "God") and falls back to a truncated first word for
// admin-customized titles that don't follow that pattern.
export function shortColumnLabel(labelShort: string): string {
  const dashIndex = labelShort.indexOf("—");
  if (dashIndex > 0) {
    return labelShort.slice(0, dashIndex).trim();
  }
  const firstWord = labelShort.trim().split(/\s+/)[0] ?? "";
  return firstWord.length > 10 ? `${firstWord.slice(0, 9)}…` : firstWord;
}
