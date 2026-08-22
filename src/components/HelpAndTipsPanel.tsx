"use client";

import { useState } from "react";

// Structure only for now — the blueprint's own content plan is a separate
// pass. Each topic gets a placeholder body at full reading size (no
// shrinking just because it's "help" content, per spec) so the real
// copy can be dropped in later without touching layout.
const TOPICS = [
  { id: "home-screen", title: "Adding the App to Your Home Screen" },
  { id: "joining-or-starting", title: "Joining or Starting a Group" },
  { id: "weekly-rhythm", title: "Your Weekly Rhythm" },
  { id: "updates-and-reactions", title: "Prayer & Life Updates and Reactions" },
  { id: "goals", title: "Goals" },
  { id: "for-leaders", title: "For Group Leaders" },
] as const;

export function HelpAndTipsPanel() {
  const [open, setOpen] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);

  const activeTopic = TOPICS.find((t) => t.id === topicId) ?? null;

  function handleBack() {
    // Two levels: a topic detail steps back to the topic list; the topic
    // list itself steps back out to Settings (closing the whole panel).
    if (activeTopic) {
      setTopicId(null);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left"
      >
        <span className="text-sm font-semibold">Help &amp; Tips</span>
        <span className="text-neutral-400">›</span>
      </button>

      <div
        className={`fixed inset-0 z-30 bg-neutral-50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="mx-auto h-full max-w-md overflow-y-auto px-4 py-6">
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 text-sm font-medium text-neutral-500"
          >
            <span aria-hidden>←</span> {activeTopic ? "Help & Tips" : "Settings"}
          </button>

          {activeTopic ? (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-brand-navy">{activeTopic.title}</h1>
              <p className="text-base text-neutral-700">Content coming soon.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-brand-navy">Help &amp; Tips</h1>
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setTopicId(topic.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left"
                >
                  <span className="text-sm font-semibold">{topic.title}</span>
                  <span className="text-neutral-400">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
