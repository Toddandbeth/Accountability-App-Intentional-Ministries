"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function JoinGroupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: rpcError } = await supabase.rpc("join_group_by_code", { p_code: code });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-xl font-semibold text-brand-navy">Request sent</h2>
        <p className="mt-1 text-[17px] text-neutral-600">
          Waiting on the group leader to approve you. You&apos;ll see the group here as soon as
          they do.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-brand-navy">Join a group</h2>
      <p className="mt-1 text-[17px] text-neutral-600">
        Enter the code your group leader shared with you.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Group code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-[17px] uppercase tracking-wider"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "…" : "Join"}
        </button>
      </form>

      {error && <p className="mt-2 text-[17px] text-red-600">{error}</p>}
    </div>
  );
}
