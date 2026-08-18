const POINTS = [
  {
    title: "The weekly rhythm",
    body: "Each week, everyone in your group privately rates 5 areas of life — takes about 20 seconds. On meeting day, your leader sees everyone's answers at a glance.",
  },
  {
    title: "When things reset",
    body: "Answers lock at 11:59pm on meeting day itself, so results stay visible through the whole meeting. A brand new week starts the day after.",
  },
  {
    title: "What the group code is for",
    body: "Your leader shares a code with the group. Enter it below to send a request to join.",
  },
  {
    title: "What happens once you're approved",
    body: "Your leader has to approve your request before you can see or submit anything. Once they do, you'll land right here automatically.",
  },
];

export function OnboardingExplainer() {
  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
      {POINTS.map((point) => (
        <div key={point.title}>
          <p className="text-sm font-semibold">{point.title}</p>
          <p className="text-xs text-neutral-500">{point.body}</p>
        </div>
      ))}
    </div>
  );
}
