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
  groupLinkLabel: string | null;
  groupText: string | null;
  platformLinkUrl: string | null;
  platformLinkLabel: string | null;
}

export function GroupUpdateBar({
  groupId,
  isAdmin,
  initialFlag,
  groupLinkUrl,
  groupLinkLabel,
  groupText,
  platformLinkUrl,
  platformLinkLabel,
}: GroupUpdateBarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [expanded, setExpanded] = useState(false);
  const [flag, setFlag] = useState(initialFlag);

  const [linkUrl, setLinkUrl] = useState(groupLinkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(groupLinkLabel ?? "");
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
      p_link_label: linkLabel || null,
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

  // Both fields or neither — never fall back to the raw URL if a label is
  // missing, and never show a label with nothing to link to.
  const hasGroupLink = Boolean(groupLinkUrl && groupLinkLabel);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center gap-2 rounded-xl bg-brand-navy p-3 text-left"
      >
        <span className="flex-1 text-[17px] font-semibold text-white">Group Update</span>
        {flag && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-periwinkle" title="New update" />
        )}
        <span className="text-[17px] text-brand-light">{expanded ? "Hide" : "View"}</span>
      </button>

      {expanded && (
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-3 text-[17px]">
          {platformLinkUrl && (
            <a
              href={platformLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg bg-brand-navy px-4 py-3 text-center font-semibold text-white"
            >
              {platformLinkLabel || platformLinkUrl}
            </a>
          )}

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            {isAdmin ? (
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-[17px] font-medium text-neutral-600">
                    Link label (optional)
                  </label>
                  <input
                    type="text"
                    placeholder='e.g. "Check out this video on 2 Peter"'
                    value={linkLabel}
                    onChange={(e) => {
                      setLinkLabel(e.target.value);
                      setPosted(false);
                    }}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[17px]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[17px] font-medium text-neutral-600">
                    Link URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      setPosted(false);
                    }}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[17px]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[17px] font-medium text-neutral-600">
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
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[17px]"
                  />
                  <div className="mt-1 text-right text-[17px] text-neutral-400">
                    {text.length}/{UPDATE_TEXT_MAX_LENGTH}
                  </div>
                </div>

                {error && <p className="text-[17px] text-red-600">{error}</p>}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePostUpdate}
                    disabled={posting}
                    className="rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white disabled:opacity-50"
                  >
                    {posting ? "Posting…" : "Post Update"}
                  </button>
                  {posted && <span className="text-[17px] text-neutral-500">Posted.</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {hasGroupLink && (
                  <a
                    href={groupLinkUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium text-brand-periwinkle underline"
                  >
                    {groupLinkLabel}
                  </a>
                )}
                {groupText ? (
                  <p className="whitespace-pre-wrap text-neutral-700">{groupText}</p>
                ) : (
                  !hasGroupLink && <p className="text-neutral-500">No update posted yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
