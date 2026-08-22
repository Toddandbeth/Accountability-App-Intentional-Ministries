"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls by re-running the server component rather than any realtime
// subscription — simple and reliable at this app's scale. The moment the
// leader approves, a DB trigger sets active_group_id server-side, and the
// next refresh here naturally swaps this screen out for the real check-in
// page with no action needed from the member.
const POLL_INTERVAL_MS = 4000;

export function PendingApprovalScreen({ groupName }: { groupName: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-2 text-center">
      <h1 className="text-2xl font-bold text-brand-navy">Waiting for approval</h1>
      <p className="text-sm text-neutral-600">
        Your request to join <span className="font-semibold">{groupName}</span> is pending. The
        group leader needs to approve you before you can see or submit anything — this page
        updates on its own the moment they do, no need to refresh.
      </p>
    </div>
  );
}
