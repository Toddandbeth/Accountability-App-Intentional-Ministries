"use client";

import { useState } from "react";

const APP_URL = "https://app.intentionalministries.com";

export function CopyAppLink() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (e.g. non-secure context) — the
      // URL is still selectable/visible as plain text either way.
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-[17px] font-semibold text-brand-navy">App link</p>
      <p className="text-[17px] text-neutral-500">
        For logging in on a new device, or sharing alongside a group code.
      </p>
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[17px] text-neutral-700">
          {APP_URL}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md bg-brand-navy px-4 py-2 text-[17px] font-semibold text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
