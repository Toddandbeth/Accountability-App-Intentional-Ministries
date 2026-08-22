"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RemoveMemberButtonProps {
  membershipId: string;
}

export function RemoveMemberButton({ membershipId }: RemoveMemberButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("memberships")
      .update({ status: "removed" })
      .eq("id", membershipId);

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (confirming) {
    return (
      <span className="flex gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="rounded-full bg-red-600 px-2 py-0.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Confirm?
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
          className="rounded-full border border-neutral-300 px-2 py-0.5 text-sm text-neutral-500"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-full border border-neutral-200 px-2 py-0.5 text-sm text-neutral-400"
    >
      Remove
    </button>
  );
}
