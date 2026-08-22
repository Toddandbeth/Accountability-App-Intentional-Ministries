"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface HideGroupToggleProps {
  membershipId: string;
  hidden: boolean;
}

export function HideGroupToggle({ membershipId, hidden }: HideGroupToggleProps) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await supabase.rpc("set_membership_hidden", {
      p_membership_id: membershipId,
      p_hidden: !hidden,
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="shrink-0 text-sm text-neutral-400 underline disabled:opacity-50"
    >
      {hidden ? "Unhide" : "Hide"}
    </button>
  );
}
