"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const UPDATE_TEXT_MAX_LENGTH = 500;

interface GroupUpdateBarProps {
  groupId: string;
  isAdmin: boolean;
  initialFlag: boolean;
  groupLinkUrl: string | null;
  groupText: string | null;
  platformLinkUrl: string | null;
  platformLinkLabel: string | null;
}

export function GroupUpdateBar({
  groupId,
  isAdmin,
  initialFlag,
  groupLinkUrl,
  groupText,
  platformLinkUrl,
  platformLinkLabel,
}: GroupUpdateBarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [expanded, setExpanded] = useState(false);
  const [flag, setFlag] = useState(initialFlag);

  const [linkUrl, setLinkUrl] = useState(groupLinkUrl ?? "");
  const [text, setText] = useState(groupText ?? "");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    if (next && flag) {
      setFlag(false);
      const { error: seenError } = await supabase.rpc("mark_group_update_seen", {
        p_group_id: groupId,
      });
      if (seenError) setFlag(true); // couldn't clear it — put the dot back
    }
  }

  async function handlePostUpdate() {
    setPosting(true);
    setError(null);
    setPosted(false);

    const { error: postError } = await supabase.rpc("post_group_update", {
      p_group_id: groupId,
      p_link_url: linkUrl || null,
      p_text: text || null,
    });

    setPosting(false);

    if (postError) {
      setError(postError.message);
      return;
    }

    setPosted(true);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        <span className="flex-1 text-sm font-semibold">Group Update</span>
        {flag && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" title="New update" />
        )}
        <span className="text-xs text-neutral-400">{expanded ? "Hide" : "View"}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-neutral-100 p-3 text-sm">
          {platformLinkUrl && (
            <a
              href={platformLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block underline"
            >
              {platformLinkLabel || platformLinkUrl}
            </a>
          )}

          {isAdmin ? (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Group link (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    setPosted(false);
                  }}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Text update (optional)
                </label>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value.slice(0, UPDATE_TEXT_MAX_LENGTH));
                    setPosted(false);
                  }}
                  rows={3}
                  maxLength={UPDATE_TEXT_MAX_LENGTH}
                  placeholder="What's going on with the group this week or month?"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
                <div className="mt-1 text-right text-xs text-neutral-400">
                  {text.length}/{UPDATE_TEXT_MAX_LENGTH}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePostUpdate}
                  disabled={posting}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {posting ? "Posting…" : "Post Update"}
                </button>
                {posted && <span className="text-xs text-neutral-500">Posted.</span>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {groupLinkUrl && (
                <a
                  href={groupLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block underline"
                >
                  {groupLinkUrl}
                </a>
              )}
              {groupText ? (
                <p className="whitespace-pre-wrap text-neutral-700">{groupText}</p>
              ) : (
                !groupLinkUrl && (
                  <p className="text-neutral-500">No update posted yet.</p>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
