"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-navy">Check your email</h1>
        <p className="mt-2 text-[17px] text-neutral-600">
          If there&apos;s an account for {email}, we sent a link to reset the password.
        </p>
        <Link href="/login" className="mt-4 inline-block text-[17px] font-medium underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-navy">Reset your password</h1>
      <p className="text-[17px] text-neutral-600">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
      />

      {error && <p className="text-[17px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-navy py-2 text-[17px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-[17px] text-neutral-600">
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
