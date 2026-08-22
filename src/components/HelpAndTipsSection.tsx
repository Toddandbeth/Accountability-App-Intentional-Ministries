"use client";

import { useState, type ReactNode } from "react";

const TOPICS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "home-screen",
    title: "Adding the App to Your Home Screen",
    body: (
      <>
        <p>
          Why do this? This app lives on the web, not in the App Store — but you can still make
          it act like a normal app on your phone, with its own icon on your home screen and no
          browser bar cluttering the screen. It only takes a minute.
        </p>
        <p className="font-semibold text-brand-navy">On iPhone (Safari):</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open the app link in Safari (this only works in Safari, not Chrome or another browser, on iPhone).</li>
          <li>Tap the Share button — the square with an arrow pointing up, usually at the bottom of the screen.</li>
          <li>Scroll down and tap &quot;Add to Home Screen.&quot;</li>
          <li>You can rename it if you want, then tap &quot;Add&quot; in the top right.</li>
          <li>The app icon now appears on your home screen. Tap it any time to open the app full-screen, just like a downloaded app.</li>
        </ol>
        <p className="font-semibold text-brand-navy">On Android (Chrome):</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open the app link in Chrome.</li>
          <li>Tap the three-dot menu in the top right corner.</li>
          <li>Tap &quot;Add to Home screen,&quot; then confirm.</li>
          <li>The app icon now appears on your home screen.</li>
        </ol>
        <p>
          One-time only. You won&apos;t need to do this again — the icon stays on your home
          screen like any other app.
        </p>
      </>
    ),
  },
  {
    id: "joining-or-starting",
    title: "Joining or Starting a Group",
    body: (
      <>
        <p>Every group has its own unique code.</p>
        <p>
          If you&apos;re joining a group: get the code from your leader and enter it when you
          sign up or from Settings. You&apos;ll then see a waiting screen while your leader
          reviews your request. Once approved, the app automatically takes you into the group —
          no need to check back or refresh anything.
        </p>
        <p>
          If you&apos;re starting a group: you&apos;re instantly placed in it as leader, with
          your own unique code generated automatically. From there, it&apos;s your job to share
          that code with your guys. As they enter it, you&apos;ll see their requests waiting for
          your approval in Settings, under Your Groups — approve each one individually to let
          them in.
        </p>
        <p>
          Belonging to more than one group? You can join or lead as many groups as you want.
          Switch between them anytime from Settings — whichever one you select becomes your
          active group, and everything you see (check-in, dashboard, history) reflects that
          group until you switch again.
        </p>
      </>
    ),
  },
  {
    id: "weekly-rhythm",
    title: "Your Weekly Rhythm",
    body: (
      <>
        <p>
          The basics: each week, you rate yourself in 5 categories and can optionally add a
          Prayer &amp; Life Update. This resets fresh every week, tied to your group&apos;s
          meeting day.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">When does it lock?</span> Your answers
          stay fully editable — change them as many times as you want — right up until 11:59 PM
          on your group&apos;s meeting day. After that, the week locks permanently. No
          exceptions, so make sure you&apos;ve checked in before your group meets.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">What if I miss a week?</span> No
          problem. A missed week just shows as blank on the dashboard — it doesn&apos;t carry
          over anything from the week before, and it doesn&apos;t affect future weeks. Just check
          in again next week.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Can I look back at past weeks?</span>{" "}
          Yes, two ways: your own personal history shows every week you&apos;ve ever submitted,
          so you can spot your own patterns over time. You can also tap any group member&apos;s
          name on the dashboard to see their last 6 weeks — this works both ways, so others can
          do the same for you. It&apos;s meant to help the group actually follow up with each
          other, not just glance at the current week and move on.
        </p>
        <p>
          If your leader changes the meeting day: your current week&apos;s deadline may shift as
          a result, but it will never create a short, rushed week — the app guarantees
          you&apos;ll always have at least a full week&apos;s notice.
        </p>
      </>
    ),
  },
  {
    id: "updates-and-reactions",
    title: "Prayer & Life Updates and Reactions",
    body: (
      <>
        <p>
          <span className="font-semibold text-brand-navy">What is it?</span> A short optional
          space on your weekly check-in — not just for prayer requests, but for anything you want
          your group to know: a struggle, a praise, an answered prayer, a life update. Whatever
          fits that week.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Who sees it?</span> Your whole group,
          not just the leader. Tap into any member&apos;s name on the dashboard to read theirs,
          right alongside their name and phone number.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Reactions.</span> Once you&apos;ve read
          someone&apos;s update, you can tap a reaction — a heart, praying hands, a thumbs up, or
          raised hands for celebration. These are simple and anonymous: your group sees that
          someone reacted, not who specifically did. It&apos;s a quiet way to let a guy know
          he&apos;s been seen, without needing to type a message.
        </p>
        <p>
          One thing to know: your update locks along with the rest of your answers once the
          week&apos;s deadline passes — but reactions stay open even after that, so someone can
          still respond to your update the next day or later, once it&apos;s sitting in history.
        </p>
      </>
    ),
  },
  {
    id: "goals",
    title: "Goals",
    body: (
      <>
        <p>
          <span className="font-semibold text-brand-navy">
            What are goals, and how are they different from the weekly check-in?
          </span>{" "}
          Your 5 weekly ratings reset every week. Goals don&apos;t — they&apos;re something you
          set once for each category (like &quot;consistent quiet times&quot; or &quot;memorize
          10 scriptures&quot;) and they stay exactly as you left them until you decide to change
          them yourself. No weekly reset, no deadline.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Where do I find mine?</span> On the
          check-in screen, right below your Prayer &amp; Life Update, tap &quot;Manage Your
          Goals&quot; to open and edit them. It stays closed by default every time you open
          check-in, so it doesn&apos;t clutter your normal weekly routine — just tap it open
          whenever you actually want to look at or update them.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Can I see other people&apos;s goals?</span>{" "}
          Yes — tap any group member&apos;s name on the dashboard, and you&apos;ll find a button
          to view their current goals in each category, right alongside their prayer updates and
          history.
        </p>
      </>
    ),
  },
  {
    id: "for-leaders",
    title: "For Group Leaders",
    body: (
      <>
        <p>
          <span className="font-semibold text-brand-navy">Group Update.</span> A collapsible bar
          at the top of your dashboard where you can post a short message and an optional link to
          your group — use it for reminders, encouragement, or anything you want your guys to see
          before they check in. There&apos;s also a permanent ministry-wide link here, managed by
          Intentional Ministries, separate from anything you control.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Managing members.</span> In Settings,
          under Your Groups, you&apos;ll find your group&apos;s member list. New join requests
          appear at the top — approve them to let someone in, or leave a request pending if
          you&apos;re not ready yet. You can also remove an active member at any time.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Changing your meeting day.</span> You
          can update this anytime in Settings. The app will always guarantee at least a full
          week&apos;s notice before the change takes effect — you&apos;ll never end up with a
          short, rushed week as a result of changing the schedule.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Renaming your group.</span> Tap the
          edit option next to your group&apos;s name under Your Groups.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Deactivating a group.</span> When a
          group has truly run its course, you can deactivate it from Settings — you&apos;ll be
          asked to confirm first, since this isn&apos;t reversible. Once deactivated, every past
          member (even someone previously removed) can still see who was part of the group,
          though not each other&apos;s private answers — a simple, lasting record of who walked
          through it together.
        </p>
      </>
    ),
  },
];

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
              <div className="space-y-3 text-[17px] text-neutral-700">{openTopic.body}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
