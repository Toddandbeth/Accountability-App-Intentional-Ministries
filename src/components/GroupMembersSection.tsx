import { MembershipRequestRow } from "@/components/MembershipRequestRow";
import { RemoveMemberButton } from "@/components/RemoveMemberButton";
import type { MembershipStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  pending: "Pending",
  removed: "Removed",
  inactive: "Inactive",
};

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
}

interface GroupMembersSectionProps {
  currentUserId: string;
  activeMembers: MemberRow[];
  pendingMembers: MemberRow[];
  otherMembers: MemberRow[];
  nameFor: (userId: string) => string;
}

export function GroupMembersSection({
  currentUserId,
  activeMembers,
  pendingMembers,
  otherMembers,
  nameFor,
}: GroupMembersSectionProps) {
  return (
    <div className="space-y-4">
      {pendingMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-700">
            Join requests ({pendingMembers.length})
          </h3>
          {pendingMembers.map((m) => (
            <MembershipRequestRow key={m.id} membershipId={m.id} name={nameFor(m.user_id)} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-700">
          Members ({activeMembers.length})
        </h3>
        {activeMembers.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
          >
            <span className="text-sm">{nameFor(m.user_id)}</span>
            <span className="flex items-center gap-1">
              {m.role === "admin" && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  Admin
                </span>
              )}
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                {STATUS_LABELS[m.status as MembershipStatus]}
              </span>
              {m.user_id !== currentUserId && <RemoveMemberButton membershipId={m.id} />}
            </span>
          </div>
        ))}
      </div>

      {otherMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-700">Former members</h3>
          {otherMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
            >
              <span className="text-sm text-neutral-500">{nameFor(m.user_id)}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                {STATUS_LABELS[m.status as MembershipStatus]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
