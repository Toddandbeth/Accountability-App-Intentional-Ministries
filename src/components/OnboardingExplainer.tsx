import Link from "next/link";

const POINTS = [
  {
    title: "The weekly rhythm",
    body: "Each week, everyone in your group privately rates 5 areas of life — takes about 20 seconds. On meeting day, everyone in the group can see everyone's answers at a glance.",
  },
  {
    title: "Weekly Reset",
    body: "Answers lock at 11:59pm on meeting day itself, so results stay visible through the whole meeting. A brand new week starts the day after.",
  },
  {
    title: "What the group code is for",
    body: "Every group is assigned a unique code. If you're joining a group, get the code from your leader — you'll then wait for approval from Settings before you can see the group. If you're starting a group, you're instantly placed in it as leader, with your own code generated automatically. You will need to share this code with your group members.",
  },
  {
    title: "What happens once you're approved",
    body: "Your leader has to approve your request before you can see or submit anything. Once they do, you'll land right here automatically.",
  },
] as const;

export function OnboardingExplainer() {
  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
      {POINTS.map((point) => (
        <div key={point.title}>
          <p className="text-[17px] font-semibold">{point.title}</p>
          <p className="text-[17px] text-neutral-500">{point.body}</p>
        </div>
      ))}
      <p className="text-[17px] text-neutral-500">
        This is the short version — the full explanation of every feature is always available in{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
