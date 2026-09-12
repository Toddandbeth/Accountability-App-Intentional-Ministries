"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WeeklyTrendPoint {
  week_start_date: string;
  submitted: number;
  possible: number;
}

interface MembershipStatusEvent {
  status: "active" | "removed";
  status_changed_at: string;
}

interface PlatformStats {
  unique_active_users: number;
  total_active_memberships: number;
  active_groups: number;
  deactivated_groups: number;
  avg_group_size: number;
  checkin_completion_rate: number | null;
  weekly_trend: WeeklyTrendPoint[];
  membership_status_events: MembershipStatusEvent[];
  pending_requests: number;
  pct_checkins_with_prayer_update: number | null;
  pct_active_members_with_goal: number | null;
}

interface PlatformAdminSectionProps {
  initialLinkUrl: string | null;
  initialLinkLabel: string | null;
}

type Bucket = "8weeks" | "12months" | "alltime";

const BUCKET_LABELS: Record<Bucket, string> = {
  "8weeks": "Last 8 Weeks",
  "12months": "Last 12 Months",
  alltime: "All Time",
};

const BUCKET_WINDOW_MS: Record<Bucket, number | null> = {
  "8weeks": 56 * 24 * 60 * 60 * 1000,
  "12months": 365 * 24 * 60 * 60 * 1000,
  alltime: null,
};

interface ChartPoint {
  label: string;
  rate: number | null;
}

// Same underlying weekly series for all three buckets — this groups/sums
// it differently per bucket rather than running three separate
// calculations, matching how the RPC hands back one array either way.
function bucketWeeklyTrend(weekly: WeeklyTrendPoint[], bucket: Bucket): ChartPoint[] {
  if (bucket === "8weeks") {
    return [...weekly]
      .sort((a, b) => a.week_start_date.localeCompare(b.week_start_date))
      .slice(-8)
      .map((w) => ({
        label: new Date(`${w.week_start_date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        rate: w.possible > 0 ? Math.round((1000 * w.submitted) / w.possible) / 10 : null,
      }));
  }

  const keyFor = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return bucket === "12months"
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : `${d.getFullYear()}`;
  };
  const labelFor = (key: string) => {
    if (bucket === "alltime") return key;
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const grouped = new Map<string, { submitted: number; possible: number }>();
  for (const w of weekly) {
    const key = keyFor(w.week_start_date);
    const g = grouped.get(key) ?? { submitted: 0, possible: 0 };
    g.submitted += w.submitted;
    g.possible += w.possible;
    grouped.set(key, g);
  }

  const points = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, g]) => ({
      label: labelFor(key),
      rate: g.possible > 0 ? Math.round((1000 * g.submitted) / g.possible) / 10 : null,
    }));

  return bucket === "12months" ? points.slice(-12) : points;
}

function countStatusEvents(events: MembershipStatusEvent[], bucket: Bucket) {
  const windowMs = BUCKET_WINDOW_MS[bucket];
  const cutoff = windowMs ? Date.now() - windowMs : null;
  let approved = 0;
  let removed = 0;
  for (const e of events) {
    if (cutoff && new Date(e.status_changed_at).getTime() < cutoff) continue;
    if (e.status === "active") approved += 1;
    else removed += 1;
  }
  return { approved, removed };
}

function BarChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) {
    return <p className="text-[17px] text-neutral-500">Not enough data yet.</p>;
  }
  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {points.map((p, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-24 w-full items-end">
            <div
              className="w-full rounded-t bg-brand-periwinkle"
              style={{ height: `${p.rate ?? 0}%` }}
              title={p.rate === null ? "No data" : `${p.rate}%`}
            />
          </div>
          <span className="text-[10px] text-neutral-500">{p.label}</span>
        </div>
      ))}
    </div>
  );
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
  const [bucket, setBucket] = useState<Bucket>("8weeks");

  const [linkUrl, setLinkUrl] = useState(initialLinkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(initialLinkLabel ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const chartPoints = useMemo(
    () => (stats ? bucketWeeklyTrend(stats.weekly_trend, bucket) : []),
    [stats, bucket]
  );
  const statusCounts = useMemo(
    () => (stats ? countStatusEvents(stats.membership_status_events, bucket) : { approved: 0, removed: 0 }),
    [stats, bucket]
  );

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
      <p className="text-[17px] font-semibold uppercase tracking-wide text-neutral-500">
        Platform Admin
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <button
          type="button"
          onClick={toggleStats}
          className="flex w-full items-center justify-between p-3 text-left text-[17px] font-semibold"
        >
          System-Wide Stats
          <span className="text-[17px] font-normal text-neutral-400">
            {statsExpanded ? "Hide" : "View"}
          </span>
        </button>
        {statsExpanded && (
          <div className="space-y-4 border-t border-neutral-100 p-3 text-[17px]">
            {statsLoading && <p className="text-neutral-500">Loading…</p>}
            {statsError && <p className="text-red-600">{statsError}</p>}
            {stats && (
              <>
                <div>
                  <p className="mb-1 text-[17px] font-semibold text-brand-navy">Reach</p>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Unique active users</dt>
                      <dd className="font-medium">{stats.unique_active_users}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Total active memberships</dt>
                      <dd className="font-medium">{stats.total_active_memberships}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Active groups</dt>
                      <dd className="font-medium">{stats.active_groups}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Deactivated groups</dt>
                      <dd className="font-medium">{stats.deactivated_groups}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Average group size</dt>
                      <dd className="font-medium">{stats.avg_group_size}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <p className="mb-1 text-[17px] font-semibold text-brand-navy">Depth of use</p>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Check-ins with a Prayer &amp; Life Update</dt>
                      <dd className="font-medium">
                        {stats.pct_checkins_with_prayer_update ?? "–"}%
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Active members with a goal set</dt>
                      <dd className="font-medium">{stats.pct_active_members_with_goal ?? "–"}%</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[17px] font-semibold text-brand-navy">Engagement</p>
                    <select
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value as Bucket)}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-[17px]"
                    >
                      {Object.entries(BUCKET_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">
                      Check-in completion rate (most recent locked week)
                    </dt>
                    <dd className="font-medium">{stats.checkin_completion_rate ?? "–"}%</dd>
                  </div>
                  <div className="mt-3">
                    <BarChart points={chartPoints} />
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[17px] font-semibold text-brand-navy">
                    Health — {BUCKET_LABELS[bucket]}
                  </p>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">New approved members</dt>
                      <dd className="font-medium">{statusCounts.approved}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Removed members</dt>
                      <dd className="font-medium">{statusCounts.removed}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Pending join requests (all-time, current)</dt>
                      <dd className="font-medium">{stats.pending_requests}</dd>
                    </div>
                  </dl>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-neutral-200 bg-white p-3">
        <p className="text-[17px] font-semibold">Ministry-wide resource link</p>
        <p className="mt-0.5 text-[17px] text-neutral-500">
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
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />
        <input
          type="url"
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => {
            setLinkUrl(e.target.value);
            setSaved(false);
          }}
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-[17px]"
        />
        {saveError && <p className="mt-2 text-[17px] text-red-600">{saveError}</p>}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-[17px] text-neutral-500">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
