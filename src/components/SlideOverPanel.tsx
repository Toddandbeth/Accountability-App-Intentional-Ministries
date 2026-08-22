"use client";

import { useState } from "react";

interface SlideOverPanelProps {
  label: string;
  title: string;
  children: React.ReactNode;
}

export function SlideOverPanel({ label, title, children }: SlideOverPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left"
      >
        <span className="text-[17px] font-semibold text-brand-navy">{label}</span>
        <span className="text-neutral-400">›</span>
      </button>

      <div
        className={`fixed inset-0 z-30 bg-neutral-50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="mx-auto h-full max-w-md overflow-y-auto px-4 py-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-4 flex items-center gap-1 text-[17px] font-medium text-neutral-500"
          >
            <span aria-hidden>←</span> {title}
          </button>
          {children}
        </div>
      </div>
    </>
  );
}
