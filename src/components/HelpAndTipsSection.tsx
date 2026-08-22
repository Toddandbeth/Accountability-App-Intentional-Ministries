"use client";

import { useState } from "react";

// TODO(content): placeholder bodies below stand in for the real copy from
// the "Help and Tips - Content Plan" reference doc, which hasn't been
// supplied to Claude Code yet — swap these in once it is.
const TOPICS = [
  {
    id: "home-screen",
    title: "Adding the App to Your Home Screen",
    body: "Content coming soon.",
  },
  {
    id: "joining-or-starting",
    title: "Joining or Starting a Group",
    body: "Content coming soon.",
  },
  { id: "weekly-rhythm", title: "Your Weekly Rhythm", body: "Content coming soon." },
  {
    id: "updates-and-reactions",
    title: "Prayer & Life Updates and Reactions",
    body: "Content coming soon.",
  },
  { id: "goals", title: "Goals", body: "Content coming soon." },
  { id: "for-leaders", title: "For Group Leaders", body: "Content coming soon." },
] as const;

export function HelpAndTipsSection() {
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const openTopic = TOPICS.find((t) => t.id === openTopicId) ?? null;

  return (
    <>
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-xl font-semibold text-brand-navy">Help &amp; Tips</h2>
        <div className="divide-y divide-neutral-100">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setOpenTopicId(topic.id)}
              className="flex w-full items-center justify-between py-2 text-left first:pt-0 last:pb-0"
            >
              <span className="text-[17px] font-medium text-neutral-700">{topic.title}</span>
              <span className="text-neutral-400">›</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-30 bg-neutral-50 transition-transform duration-300 ease-out ${
          openTopic ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={!openTopic}
      >
        <div className="mx-auto h-full max-w-md overflow-y-auto px-4 py-6">
          <button
            type="button"
            onClick={() => setOpenTopicId(null)}
            className="mb-4 flex items-center gap-1 text-[17px] font-medium text-neutral-500"
          >
            <span aria-hidden>←</span> Settings
          </button>

          {openTopic && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-brand-navy">{openTopic.title}</h1>
              <p className="text-[17px] text-neutral-700">{openTopic.body}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
