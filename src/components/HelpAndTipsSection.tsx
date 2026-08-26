"use client";

import { useState, type ReactNode } from "react";

// Subsection collapse/expand, reused for Dashboard and Leader Guide below
// (Round 18) — same interaction pattern as the Prayer & Life Update and
// Goals sections elsewhere in the app: tap a heading, only that piece
// expands, the rest stay collapsed.
function AccordionItem({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-[17px] font-semibold text-brand-navy">{title}</span>
        <span className="text-neutral-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="space-y-2 pb-3 text-[17px] text-neutral-700">{children}</div>}
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <p className="pt-2 text-[17px] font-semibold text-brand-navy">{children}</p>;
}

const TOPICS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "home-screen",
    title: "Add App to Home Screen",
    body: (
      <>
        <p>
          Why do this? This app lives on the web, not in the App Store, but you can still make it
          act like a normal app on your phone, with its own icon on your home screen and no
          browser bar cluttering the screen. It only takes a minute.
        </p>
        <SubHeading>On iPhone (Safari):</SubHeading>
        <ul className="list-disc space-y-1 pl-5">
          <li>Open the app link in Safari (this only works in Safari, not Chrome or another browser, on iPhone).</li>
          <li>Tap the Share button, the square with an arrow pointing up, usually at the bottom of the screen.</li>
          <li>Scroll down and tap &quot;Add to Home Screen.&quot;</li>
          <li>You can rename it if you want, then tap &quot;Add&quot; in the top right.</li>
          <li>The app icon now appears on your home screen. Tap it any time to open the app full-screen, just like a downloaded app.</li>
        </ul>
        <SubHeading>On Android (Chrome):</SubHeading>
        <ul className="list-disc space-y-1 pl-5">
          <li>Open the app link in Chrome.</li>
          <li>Tap the three-dot menu in the top right corner.</li>
          <li>Tap &quot;Add to Home screen,&quot; then confirm.</li>
          <li>The app icon now appears on your home screen.</li>
        </ul>
        <p>One-time only. You won&apos;t need to do this again, the icon stays on your home screen like any other app.</p>
      </>
    ),
  },
  {
    id: "checkin",
    title: "Check-in",
    body: (
      <>
        <p>The Check-in tab is where you complete your weekly personal check-in.</p>

        <SubHeading>Your Weekly Check-in</SubHeading>
        <p>Each week you will rate yourself in five categories.</p>
        <p>For each category, choose the response that best describes where you are that week:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Strong</li>
          <li>Good</li>
          <li>Okay</li>
          <li>Weak</li>
          <li>Help</li>
        </ul>
        <p>
          Choose the answer that is most accurate, not the answer you think you should give. The
          purpose is to give your group an honest picture of how you are doing so you can
          encourage and help one another.
        </p>
        <p>You can change any of your answers until the week&apos;s deadline.</p>

        <SubHeading>Category Descriptions</SubHeading>
        <p>Each category includes a description to help you think through what you are actually rating.</p>
        <p>Tap Hide Descriptions if you already know the questions and want a cleaner screen.</p>
        <p>You can show them again whenever you need them.</p>

        <SubHeading>Meeting Date</SubHeading>
        <p>Near the top of the Check-in screen you will see your group&apos;s upcoming meeting date.</p>
        <p>
          Your check-in remains open through 11:59 PM on that meeting day. After the deadline,
          that week&apos;s answers are locked and a new week begins.
        </p>
        <p>If you miss a week, nothing carries forward from the previous week. The new week simply begins blank.</p>

        <SubHeading>Prayer &amp; Life Update</SubHeading>
        <p>Below your five ratings is an optional Prayer &amp; Life Update.</p>
        <p>Use this to share something your group should know about this week. It could be:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>A prayer request</li>
          <li>A struggle</li>
          <li>Something you are celebrating</li>
          <li>An answered prayer</li>
          <li>An important life update</li>
          <li>Something connected to one of your five ratings</li>
        </ul>
        <p>You do not have to submit an update every week.</p>
        <p>Your Prayer &amp; Life Update can be seen by the members of your group.</p>

        <SubHeading>Manage Your Goals</SubHeading>
        <p>Tap Manage Your Goals near the bottom of the Check-in screen to view or edit your goals.</p>
        <p>You can set one goal for each of your five categories.</p>
        <p>Unlike your weekly ratings, goals do not reset each week. They remain in place until you decide to change them.</p>
        <p>Examples might include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Spend time in Scripture five days each week</li>
          <li>Schedule a date night twice a month</li>
          <li>Exercise three times each week</li>
          <li>Pay off a specific debt</li>
          <li>Establish stronger boundaries with my phone</li>
        </ul>
        <p>Goals are optional. They are simply a way to identify an intentional next step in an area where you want to grow.</p>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    body: (
      <>
        <p className="mb-2">The Dashboard gives your group a quick picture of how everyone is doing this week.</p>

        <AccordionItem title="Reading the Dashboard">
          <p>Each person has one row showing his five weekly ratings.</p>
          <p>The columns correspond to your group&apos;s five categories.</p>
          <p>The colors and labels make it easy to see where someone is doing well and where he may need encouragement, prayer, or a conversation.</p>
          <p>The purpose is not to compare scores. The Dashboard is designed to help your group quickly know where to follow up with one another.</p>
        </AccordionItem>

        <AccordionItem title="Opening a Member's Information">
          <p>Tap any member&apos;s row to see more information.</p>
          <p>The expanded section shows:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>His name</li>
            <li>His phone number, if provided</li>
            <li>His Prayer &amp; Life Update</li>
            <li>Reactions to his update</li>
            <li>His recent history</li>
            <li>His current goals</li>
          </ul>
          <p>If a phone number is available, you can tap it to contact him.</p>
        </AccordionItem>

        <AccordionItem title="Prayer & Life Updates">
          <p>If someone submitted a Prayer &amp; Life Update, an indicator appears beside his profile picture or initials.</p>
          <p>Tap his row to read the update.</p>
          <p>This lets the main Dashboard stay simple while still making more information available when you need it.</p>
        </AccordionItem>

        <AccordionItem title="Reactions">
          <p>When someone shares a Prayer &amp; Life Update, you can respond using one of four reactions:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Heart</li>
            <li>Prayer</li>
            <li>Thumbs up</li>
            <li>Praise or celebration</li>
          </ul>
          <p>Reactions are simple counters. They are not connected to your name, so the person can see that someone responded without seeing exactly who tapped the reaction.</p>
          <p>Reactions remain available even after that week&apos;s check-in has locked.</p>
        </AccordionItem>

        <AccordionItem title="Viewing Someone's History">
          <p>Tap a member&apos;s row and choose 6-Week History to look back at his recent check-ins.</p>
          <p>This can help you recognize patterns and remember things that were shared in previous weeks.</p>
          <p>For example, you may notice that someone has rated the same area Weak for several weeks or remember a prayer request you want to follow up on.</p>
        </AccordionItem>

        <AccordionItem title="Viewing Your Own History">
          <p>Tap your own row on the Dashboard to access your history.</p>
          <p>Your personal history is not limited to six weeks. You can look back through your previous check-ins to identify patterns in your own life over time.</p>
        </AccordionItem>

        <AccordionItem title="Viewing Goals">
          <p>Tap a member&apos;s row and choose the option to view his goals.</p>
          <p>You can see the goals he has set for each category.</p>
          <p>Goals are current goals, not weekly records. They remain until that person changes them.</p>
        </AccordionItem>

        <AccordionItem title="Group Update">
          <p>At the top of the Dashboard is the Group Update section.</p>
          <p>This may include:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>A link to discipleship resources from Intentional Ministries</li>
            <li>A message from your group leader</li>
            <li>A link your leader wants the group to see</li>
          </ul>
          <p>Tap the Group Update section to expand it.</p>
          <p>An indicator light appears next to Group Update whenever your leader has posted something new that you haven&apos;t seen yet. It clears automatically the first time you open the section.</p>
        </AccordionItem>
      </>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    body: (
      <>
        <p>The Settings tab is where you manage your profile, groups, and app preferences.</p>

        <SubHeading>Profile</SubHeading>
        <p>Your Profile contains your personal information, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name</li>
          <li>Email</li>
          <li>Phone number</li>
          <li>Profile photo</li>
        </ul>
        <p>If you do not use a profile photo, your initials will appear instead.</p>
        <p>You can also choose the color used behind your initials.</p>
        <p>Keeping your phone number current allows group members to contact you directly from the Dashboard.</p>
        <p>
          You can update your email address anytime from your Profile. Since your email is also
          what you use to log in, a confirmation link is sent to the new address, and the change
          takes effect once you confirm it, this keeps your account secure and makes sure a typo
          can&apos;t accidentally lock you out. Your password stays exactly the same; only the
          email itself changes.
        </p>

        <SubHeading>Your Groups</SubHeading>
        <p>You can belong to more than one accountability group.</p>
        <p>Your Groups shows the groups connected to your account.</p>
        <p>The group you are currently viewing is your active group. Your Check-in and Dashboard always display information for that group.</p>
        <p>Tap another group to switch to it.</p>

        <SubHeading>Joining a Group</SubHeading>
        <p>To join an existing group:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Get the group code from the leader.</li>
          <li>Choose Join a Group.</li>
          <li>Enter the code.</li>
          <li>Submit your request.</li>
        </ul>
        <p>Your request must be approved by the group leader before you can access the group.</p>
        <p>Once approved, the group becomes available in Your Groups.</p>

        <SubHeading>Creating a Group</SubHeading>
        <p>Choose Create a Group if you want to start and lead your own accountability group.</p>
        <p>A unique group code will be created automatically.</p>
        <p>Share that code with the people you want to invite. Each person will request to join, and you will approve them before they receive access.</p>

        <SubHeading>Hidden Groups</SubHeading>
        <p>If your list of groups becomes crowded over time, you can hide groups you no longer need to see regularly.</p>
        <p>Hiding a group does not delete it or erase your history.</p>
        <p>You can view your hidden groups later and restore one to your regular group list.</p>
        <p>Your currently active group cannot be hidden. Switch to another group first if you want to hide it.</p>

        <SubHeading>Weekly Questions</SubHeading>
        <p>Group leaders can customize the five questions used by their group.</p>
        <p>If you are not a leader, the questions you see were selected by your group&apos;s leader.</p>

        <SubHeading>Finding the App&apos;s Link</SubHeading>
        <p>
          Your Settings page includes a copy of the app&apos;s web address, with a Copy button
          right beside it so you can copy it in one tap instead of trying to select and copy the
          text yourself. Use this if you ever need to open the app on a new device, or if you want
          to share the exact link alongside a group code when inviting someone to join.
        </p>
      </>
    ),
  },
  {
    id: "leader-guide",
    title: "Leader Guide",
    body: (
      <>
        <p className="mb-2">If you create a group, you become the leader for that group and receive additional tools for managing it.</p>

        <AccordionItem title="Creating Your Group">
          <p>Choose Create a Group from Settings.</p>
          <p>Enter your group information and the app will create a unique group code.</p>
          <p>Share that code with the people you want to invite.</p>
          <p>Members cannot enter the group simply by knowing the code. Each request must still be approved by a leader.</p>
        </AccordionItem>

        <AccordionItem title="Approving Members">
          <p>New join requests appear with your group&apos;s member information in Settings.</p>
          <p>Pending requests appear first so they are easy to see.</p>
          <p>Approve a request to give that person access to the group.</p>
          <p>Until you approve the request, that person cannot see the group&apos;s Dashboard or submit a check-in for the group.</p>
          <p>Tip: After creating your group, text your group members the link and code. Ask them to text you once they&apos;ve completed the process, so you know to go approve them.</p>
        </AccordionItem>

        <AccordionItem title="Removing a Member">
          <p>You can remove an active member from the group in Settings.</p>
          <p>Removing someone immediately ends his access to the active group.</p>
          <p>His previous personal check-in history is not deleted.</p>
          <p>If he later enters the group code again, he must submit a new request and be approved again.</p>
          <p>
            When a removed member logs back into his account, he&apos;ll find himself in a group
            by himself, with access only to his own personal history. He&apos;s free to start a
            new group of his own, or request to join another group, even the same group he was
            removed from, but any request will need to be approved again before he regains access.
          </p>
        </AccordionItem>

        <AccordionItem title="Group Code">
          <p>Your group code is displayed with your group information in Settings.</p>
          <p>Share this code with anyone you want to invite into the group.</p>
          <p>There is no need to change the code when someone leaves or is removed.</p>
        </AccordionItem>

        <AccordionItem title="Renaming Your Group">
          <p>Use the edit option next to your active group&apos;s name to rename the group.</p>
          <p>Changing the name does not affect the group&apos;s members, history, or group code.</p>
          <p>You&apos;ll find this as a small pencil icon right next to your active group&apos;s name, under Your Groups in Settings.</p>
        </AccordionItem>

        <AccordionItem title="Meeting Day">
          <p>Your group&apos;s meeting day determines the weekly rhythm and deadline.</p>
          <p>Members can edit their check-ins through 11:59 PM on the group&apos;s meeting day.</p>
          <p>You can change the regular meeting day in Settings.</p>
          <p>Changing the meeting day is intended for a lasting schedule change, not simply moving one individual meeting.</p>
          <p>When you change it, the app will show you the resulting meeting and lock date. The app will not create a shortened week. Members will always receive at least a full weekly cycle before the new deadline.</p>
        </AccordionItem>

        <AccordionItem title="Managing Weekly Questions">
          <p>Your group begins with five default accountability questions.</p>
          <p>You can edit:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The short category name</li>
            <li>The category title</li>
            <li>The description</li>
          </ul>
          <p>Changes apply only to your group.</p>
          <p>Use Reset to Defaults if you want to return all five questions to the original Intentional Ministries questions.</p>
        </AccordionItem>

        <AccordionItem title="Group Update">
          <p>The Group Update section appears at the top of your group&apos;s Dashboard.</p>
          <p>Use it to communicate something you want your group to see.</p>
          <p>You can add:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>A short written update</li>
            <li>A link</li>
            <li>A short label describing the link</li>
          </ul>
          <p>For example: Watch this week&apos;s 2 Peter video</p>
          <p>The group sees the label as the clickable text rather than seeing a long web address.</p>
          <p>The Intentional Ministries resource shown in this same area is managed separately and cannot be edited by the group leader.</p>
        </AccordionItem>

        <AccordionItem title="Deactivating a Group">
          <p>When a group has permanently finished, you can deactivate it.</p>
          <p>Deactivation is different from simply having a group that has not met recently. Use this when the group is truly over.</p>
          <p>The group&apos;s historical information is preserved.</p>
          <p>Members continue to have access to their own previous check-ins, and the people who were part of the completed group can still see a basic roster of who participated.</p>
          <p>Deactivation does not give former members access to one another&apos;s private historical ratings, updates, or goals.</p>
          <p>This action is permanent. Once a group is deactivated, it cannot be reactivated.</p>
        </AccordionItem>
      </>
    ),
  },
  {
    id: "faq",
    title: "Questions & Answers",
    body: (
      <>
        <p>
          <span className="font-semibold text-brand-navy">What happens if I miss a week?</span>{" "}
          Nothing carries over. The new week simply starts blank, and you can check in normally
          next time.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Can I change my answers after I submit them?</span>{" "}
          Yes, anytime before your group&apos;s weekly deadline (11:59 PM on your meeting day).
          After that, your answers lock.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Who can see my Prayer &amp; Life Update?</span>{" "}
          Everyone in your group, not just the leader.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Can other members see who reacted to my update?</span>{" "}
          No. Reactions are anonymous counters, your group can see that someone responded, not who.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">What&apos;s the difference between my weekly ratings and my goals?</span>{" "}
          Ratings reset every week. Goals don&apos;t, they stay exactly as you set them until you
          change them yourself.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">Can I be part of more than one group?</span>{" "}
          Yes. In Settings, you can start a new group or join another one yourself anytime, and
          switch your active group whenever you want. Each group you&apos;re part of is
          independent.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">I was removed from a group, can I rejoin?</span>{" "}
          Yes, but you&apos;ll need to be approved again, just like any new member.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">If I&apos;m in two groups, do I need to answer the questions twice?</span>{" "}
          Yes. Your ratings, prayer requests, and goals don&apos;t carry over between groups, each
          group is completely separate, so you&apos;ll check in for each one on its own.
        </p>
        <p>
          <span className="font-semibold text-brand-navy">What happens to my history if my leader deactivates the group?</span>{" "}
          Your own personal history stays fully accessible to you. You&apos;ll also be able to see
          a simple list of who was in the group, though not anyone else&apos;s private answers.
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
