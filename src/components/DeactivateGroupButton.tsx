"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DeactivateGroupButtonProps {
  groupId: string;
  isActive: boolean;
}

export function DeactivateGroupButton({ groupId, isActive }: DeactivateGroupButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setActive(next: boolean) {
    setBusy(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("set_group_active", {
      p_group_id: groupId,
      p_is_active: next,
    });

    setBusy(false);
    setConfirming(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.refresh();
  }

  if (!isActive) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-500">
          This group is deactivated. Anyone who was ever a member can still view a simple roster,
          but the group no longer appears as an active dashboard for anyone.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => setActive(true)}
          className="text-sm font-medium text-neutral-500 underline disabled:opacity-50"
        >
          Reactivate group
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-600">
          Deactivating doesn&apos;t delete anything — everyone who was ever a member will still be
          able to see a simple roster, just not the live dashboard.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <span className="flex gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => setActive(false)}
            className="rounded-full bg-red-600 px-2 py-0.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Confirm deactivate
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
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-neutral-400 underline"
    >
      Deactivate this group
    </button>
  );
}
