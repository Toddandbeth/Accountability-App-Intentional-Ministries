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

  const displayName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-base font-semibold text-brand-navy">Your profile</h2>

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
          type="tel"
          placeholder="Cell phone (optional)"
          value={cellPhone}
          onChange={(e) => setCellPhone(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-neutral-500">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-brand-navy py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
