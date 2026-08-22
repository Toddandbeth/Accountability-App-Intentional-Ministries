const TOPICS = [
  {
    title: "The weekly rhythm",
    body: "Rate each of your group's 5 categories with one tap — takes about 20 seconds. Answers lock at 11:59pm on your group's meeting day, then a new week starts. Any group member can tap another member's name on the dashboard to see their last 6 weeks, including yours.",
  },
  {
    title: "Prayer & Life Update",
    body: "An optional note alongside your ratings each week — a request, a praise, or a quick update. It resets with the rest of your check-in each week, and stays editable until the week locks. Group members can react to it with a heart, prayer hands, thumbs up, or praise — even after it's locked and moved into history.",
  },
  {
    title: "Goals",
    body: "Unlike your weekly ratings, a goal per category is optional, persistent, and never resets or locks — it stays exactly as you set it until you change it. Set yours below. Anyone in the group can see them by tapping \"See [Name]'s Goals\" on the dashboard.",
  },
  {
    title: "Group code",
    body: "Share your group's code with anyone you want to invite. Entering a code sends a join request the group's admin has to approve before that person can see or submit anything.",
  },
  {
    title: "Hiding and past groups",
    body: "If you're no longer active in a group, or a group goes inactive, you keep permanent access to your own history there — just not the live dashboard. You can also hide a group you're still in from cluttering your list without leaving it; hidden groups are always one tap away to unhide.",
  },
];

export function HowThisWorksSection() {
  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-brand-navy">How this works</h2>
      <div className="divide-y divide-neutral-100">
        {TOPICS.map((topic) => (
          <details key={topic.title} className="group py-2 first:pt-0 last:pb-0">
            <summary className="cursor-pointer text-[17px] font-medium text-neutral-700 marker:text-neutral-400">
              {topic.title}
            </summary>
            <p className="mt-1 text-[17px] text-neutral-500">{topic.body}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
