"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MembershipRequestRowProps {
  membershipId: string;
  name: string;
}

export function MembershipRequestRow({ membershipId, name }: MembershipRequestRowProps) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(status: "active" | "removed") {
    setBusy(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("memberships")
      .update({ status })
      .eq("id", membershipId);

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
      <span className="text-sm font-medium">{name}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => respond("active")}
          className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond("removed")}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-700 disabled:opacity-50"
        >
          Deny
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
