"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PlatformStats {
  active_groups: number;
  total_participants: number;
  check_ins_last_7_days: number;
}

interface PlatformAdminSectionProps {
  initialLinkUrl: string | null;
  initialLinkLabel: string | null;
}

export function PlatformAdminSection({
  initialLinkUrl,
  initialLinkLabel,
}: PlatformAdminSectionProps) {
  const router = useRouter();
  const supabase = createClient();

  const [statsExpanded, setStatsExpanded] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [linkUrl, setLinkUrl] = useState(initialLinkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(initialLinkLabel ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function toggleStats() {
    const next = !statsExpanded;
    setStatsExpanded(next);

    if (next && !stats) {
      setStatsLoading(true);
      setStatsError(null);
      const { data, error } = await supabase.rpc("get_platform_stats");
      setStatsLoading(false);
      if (error) {
        setStatsError(error.message);
        return;
      }
      setStats(data as PlatformStats);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const { error } = await supabase
      .from("platform_settings")
      .update({ resource_link_url: linkUrl || null, resource_link_label: linkLabel || null })
      .eq("id", true);

    setSaving(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-300 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Platform Admin
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <button
          type="button"
          onClick={toggleStats}
          className="flex w-full items-center justify-between p-3 text-left text-sm font-semibold"
        >
          System-Wide Stats
          <span className="text-xs font-normal text-neutral-400">
            {statsExpanded ? "Hide" : "View"}
          </span>
        </button>
        {statsExpanded && (
          <div className="border-t border-neutral-100 p-3 text-sm">
            {statsLoading && <p className="text-neutral-500">Loading…</p>}
            {statsError && <p className="text-red-600">{statsError}</p>}
            {stats && (
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Active groups</dt>
                  <dd className="font-medium">{stats.active_groups}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Total participants</dt>
                  <dd className="font-medium">{stats.total_participants}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Check-ins, last 7 days</dt>
                  <dd className="font-medium">{stats.check_ins_last_7_days}</dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-neutral-200 bg-white p-3">
        <p className="text-sm font-semibold">Ministry-wide resource link</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Shown to every user, in every group. Managed entirely outside the app — this just
          stores the URL.
        </p>
        <input
          type="text"
          placeholder="Label, e.g. This month's challenge"
          value={linkLabel}
          onChange={(e) => {
            setLinkLabel(e.target.value);
            setSaved(false);
          }}
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="url"
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => {
            setLinkUrl(e.target.value);
            setSaved(false);
          }}
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-xs text-neutral-500">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
