// TEMPORARY — for comparing candidate type sizes on a real phone via the
// local dev server before applying anything app-wide. Not linked from any
// nav. Delete this whole route once a size decision is made.

const CANDIDATES = [
  {
    name: "A — Current (baseline)",
    title: 24,
    header: 16,
    body: 14,
    button: 14,
  },
  {
    name: "B — Modest increase",
    title: 28,
    header: 18,
    body: 16,
    button: 16,
  },
  {
    name: "C — Larger increase",
    title: 32,
    header: 20,
    body: 17,
    button: 17,
  },
] as const;

export default function FontPreviewPage() {
  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Font size preview</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Temporary comparison page — not part of the real app. Scroll through each option below.
        </p>
      </div>

      {CANDIDATES.map((c) => (
        <div key={c.name} className="space-y-3 rounded-xl border-2 border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {c.name}
          </p>

          <p style={{ fontSize: c.title, fontWeight: 700, color: "#253551" }}>Dashboard</p>
          <p className="text-xs text-neutral-400">Title — {c.title}px bold</p>

          <p style={{ fontSize: c.header, fontWeight: 600, color: "#253551" }}>Your groups</p>
          <p className="text-xs text-neutral-400">Header — {c.header}px semibold</p>

          <p style={{ fontSize: c.body, color: "#525252" }}>
            Rate each of your group&apos;s 5 categories with one tap — takes about 20 seconds.
            Answers lock at 11:59pm on meeting day itself.
          </p>
          <p className="text-xs text-neutral-400">Body — {c.body}px</p>

          <button
            type="button"
            style={{ fontSize: c.button, fontWeight: 600 }}
            className="w-full rounded-md bg-brand-navy py-2 text-white"
          >
            Save profile
          </button>
          <p className="text-xs text-neutral-400">Button — {c.button}px semibold</p>
        </div>
      ))}
    </div>
  );
}
