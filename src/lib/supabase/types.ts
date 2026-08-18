// Hand-written types matching supabase/migrations/0001_init.sql and
// 0002_round3.sql. Once a live Supabase project exists, these can be
// regenerated with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

export type MembershipRole = "admin" | "member";
export type MembershipStatus = "active" | "inactive" | "pending" | "removed";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  cell_phone: string | null;
  profile_image_url: string | null;
  active_group_id: string | null;
  platform_admin: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  slug: string;
  meeting_day: number; // 0=Sunday .. 6=Saturday
  timezone: string;
  creator_id: string;
  is_active: boolean;
  group_update_link_url: string | null;
  group_update_text: string | null;
  group_update_flag: boolean;
  pending_meeting_day: number | null;
  pending_meeting_day_effective_after: string | null;
  created_at: string;
}

export interface PlatformSettings {
  id: true;
  resource_link_url: string | null;
  resource_link_label: string | null;
}

export interface Membership {
  id: string;
  user_id: string;
  group_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  joined_at: string;
}

export interface GroupQuestion {
  id: string;
  group_id: string;
  label_short: string;
  label_description: string;
  slot_number: number; // 1-5
  goal_enabled: boolean;
}

export interface WeeklyCheckIn {
  id: string;
  user_id: string;
  group_id: string;
  week_start_date: string; // YYYY-MM-DD
  rating_1: number | null;
  rating_2: number | null;
  rating_3: number | null;
  rating_4: number | null;
  rating_5: number | null;
  prayer_request: string | null;
  reaction_heart_count: number;
  reaction_pray_count: number;
  reaction_thumbsup_count: number;
  reaction_praise_count: number;
  updated_at: string;
}

// RPC function names, for reference — supabase.rpc("...", args) isn't
// generic-checked until a real Database type is generated (see note above).
export const RPC = {
  createGroup: "create_group",
  joinGroupByCode: "join_group_by_code",
  resetGroupQuestions: "reset_group_questions",
  setGroupMeetingDay: "set_group_meeting_day",
  currentWeekStart: "current_week_start",
  isWeekEditable: "is_week_editable",
  weekDeadline: "week_deadline",
  postGroupUpdate: "post_group_update",
  markGroupUpdateSeen: "mark_group_update_seen",
  getPlatformStats: "get_platform_stats",
  incrementReaction: "increment_reaction",
  getGroupBasicInfo: "get_group_basic_info",
  getGroupRoster: "get_group_roster",
  setGroupActive: "set_group_active",
  setMembershipHidden: "set_membership_hidden",
} as const;

export interface GroupBasicInfo {
  id: string;
  name: string;
  is_active: boolean;
}

export interface GroupRosterMember {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}
