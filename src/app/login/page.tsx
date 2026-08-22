"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Its own full-bleed route rather than sharing (auth)/layout.tsx — this
// screen's navy backdrop and much larger logo are deliberately distinct
// from signup/forgot-password/reset-password, which keep the shared
// lighter treatment.
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/checkin");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-navy px-4 py-8">
      <Image
        src="/brand/IM_-_Main_-_white.png"
        alt="Intentional Ministries"
        width={1076}
        height={917}
        priority
        className="mb-8 h-auto w-64"
      />

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />

        {error && <p className="text-[17px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-periwinkle py-2 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <p className="text-center text-[17px]">
          <Link href="/forgot-password" className="text-neutral-500 underline">
            Forgot password?
          </Link>
        </p>

        <p className="text-center text-[17px] text-neutral-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-neutral-900 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
