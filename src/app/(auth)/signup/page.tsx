"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/checkin");
      router.refresh();
    } else {
      setPendingConfirmation(true);
    }
  }

  if (pendingConfirmation) {
    // A fixed full-bleed overlay rather than relying on the shared
    // (auth)/layout.tsx background — that layout stays light for the
    // signup form itself, but this state should carry the same navy
    // treatment as /login rather than breaking continuity right after it.
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-navy px-4 py-8">
        <Image
          src="/brand/IM_-_Main_-_white.png"
          alt="Intentional Ministries"
          width={1076}
          height={917}
          priority
          className="mb-8 h-auto w-64"
        />
        <div className="w-full max-w-sm space-y-2 rounded-xl bg-white p-6 text-center">
          <h1 className="text-2xl font-bold text-brand-navy">Check your email</h1>
          <p className="text-[17px] text-neutral-600">
            We sent a confirmation link to {email}. Follow it to finish creating your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-navy">Create your account</h1>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />
        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
      />

      <input
        type="password"
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
      />

      {error && <p className="text-[17px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-navy py-2 text-[17px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-center text-[17px] text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
