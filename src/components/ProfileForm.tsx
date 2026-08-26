"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/AvatarUpload";
import { InitialsColorPicker } from "@/components/InitialsColorPicker";
import type { Profile } from "@/lib/supabase/types";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [cellPhone, setCellPhone] = useState(profile.cell_phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Separate from the name/phone form above: changing email goes through
  // Supabase's own confirm-before-it-takes-effect flow (a link sent to the
  // new address), not a plain profiles table update, so it needs its own
  // submit action rather than sharing "Save profile"'s.
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(profile.email ?? "");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailRequested, setEmailRequested] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        cell_phone: cellPhone || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailError(null);
    setEmailRequested(false);

    const { error: updateError } = await supabase.auth.updateUser({ email });

    setEmailSaving(false);

    if (updateError) {
      setEmailError(updateError.message);
      return;
    }

    setEmailRequested(true);
  }

  function cancelEmailEdit() {
    setEditingEmail(false);
    setEmail(profile.email ?? "");
    setEmailError(null);
    setEmailRequested(false);
  }

  const displayName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-brand-navy">Your profile</h2>

      <AvatarUpload
        userId={profile.id}
        name={displayName}
        currentImageUrl={profile.profile_image_url}
        initialsColor={profile.initials_circle_color}
      />

      <InitialsColorPicker userId={profile.id} currentColor={profile.initials_circle_color} />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
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
          type="tel"
          placeholder="Cell phone (optional)"
          value={cellPhone}
          onChange={(e) => setCellPhone(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />

        {error && <p className="text-[17px] text-red-600">{error}</p>}
        {saved && !error && <p className="text-[17px] text-neutral-500">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-brand-navy py-2 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      {editingEmail ? (
        <form onSubmit={handleEmailSubmit} className="space-y-2 border-t border-neutral-100 pt-3">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailRequested(false);
            }}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
          />
          {emailError && <p className="text-[17px] text-red-600">{emailError}</p>}
          {emailRequested && (
            <p className="text-[17px] text-neutral-500">
              Confirmation link sent to {email}. Your email won&apos;t change until you confirm
              it from that link — your password stays the same either way.
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={emailSaving || email === profile.email}
              className="rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white disabled:opacity-50"
            >
              {emailSaving ? "Sending…" : "Send confirmation link"}
            </button>
            <button
              type="button"
              onClick={cancelEmailEdit}
              className="text-[17px] text-neutral-500 underline"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
          <p className="text-[17px] text-neutral-500">{profile.email}</p>
          <button
            type="button"
            onClick={() => setEditingEmail(true)}
            className="shrink-0 text-[17px] font-medium text-brand-periwinkle underline"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}
