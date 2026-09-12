import Link from "next/link";

// Round 21: exact, finalized wording — see the blueprint's "Create/Join
// landing screen wording" spec. Not paraphrased.
const POINTS = [
  {
    title: "How It Works",
    body: "This app is a simple weekly self-evaluation designed to help your group encourage and hold one another accountable. Each week, everyone rates themselves in five areas of life, and the group's responses are shared on the Dashboard so you can quickly see how everyone is doing.",
  },
  {
    title: "Create a Group",
    body: "Starting a new group? Choose Create a Group below. You'll become the group leader and receive a unique group code. Share the code and the app link with the people you want to invite. They'll use the code to request to join your group, and you'll approve each person before they have access.",
  },
  {
    title: "Join a Group",
    body: "Already been invited to a group? Choose Join a Group below and enter the group code your leader gave you. Your leader will approve your request before you can access the group. Once you're approved, you're ready to begin.",
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
      <div>
        <p className="text-[17px] font-semibold">Need Help?</p>
        <p className="text-[17px] text-neutral-500">
          Once you&apos;re inside the app, visit Help &amp; Tips in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          for instructions on using the Check-in, Dashboard, Settings, and leader tools.
        </p>
      </div>
    </div>
  );
}
