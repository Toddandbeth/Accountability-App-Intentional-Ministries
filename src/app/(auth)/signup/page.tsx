"use client";

import { useState } from "react";
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
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-neutral-600">
          We sent a confirmation link to {email}. Follow it to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-lg font-semibold">Create your account</h1>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />

      <input
        type="password"
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-navy py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
