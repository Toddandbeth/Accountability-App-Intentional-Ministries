"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  filled: boolean;
}

// Document + checkmark badge, shape/style based on the provided reference
// (design-references/checkin-icon-reference.png), recolored to the app's
// own brand tokens rather than dropped in as a literal asset.
function CheckInIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <rect x="5" y="4" width="11" height="16" rx="2" />
        <path d="M8.5 9h4M8.5 12.5h4M8.5 16h2" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="17" cy="17" r="4.3" stroke="white" strokeWidth={1} />
        <path
          d="M15.2 17.1 16.4 18.3 18.7 16"
          stroke="white"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="5" y="4" width="11" height="16" rx="2" strokeLinejoin="round" />
      <path d="M8.5 9h4M8.5 12.5h4M8.5 16h2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="4" />
      <path d="M15.2 17.1 16.4 18.3 18.7 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Gauge/speedometer, redesigned per Round 16 against the provided
// reference (design-references/dashboard-gauge-reference.png): a fuller
// ~270-degree sweep (vs. the previous smaller arc), a thicker needle, and
// tick marks at each end and top-center.
function DashboardIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
        <path d="M6.34 19.66A8 8 0 0 1 12 6a8 8 0 0 1 5.66 13.66l-1.42-1.42A6 6 0 0 0 12 8a6 6 0 0 0-4.24 10.24Z" />
        <circle cx="12" cy="14" r="2.1" />
        <path d="M12 14 16.8 17.7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path
        d="M6.34 19.66A8 8 0 0 1 12 6a8 8 0 0 1 5.66 13.66"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.34 19.66 5.28 20.72M12 6 12 4.5M17.66 19.66 18.72 20.72" strokeLinecap="round" />
      <circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 14 16.8 17.7" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.4 13a7.6 7.6 0 0 0 .1-2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3h-6l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4L4.5 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 21h6l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.1Z" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13a7.6 7.6 0 0 0 .1-2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3h-6l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4L4.5 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 21h6l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ITEMS = [
  { href: "/checkin", label: "Check-in", Icon: CheckInIcon },
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

// The reported bug ("sometimes a tap does nothing, and holding it down
// opens a different, unintended screen instead") is iOS Safari's default
// long-press behavior on links, not a styling or hit-target issue: with
// no touch-action set, a touch sequence stays ambiguous for a beat while
// the browser waits to see if it's a double-tap-to-zoom, which is what
// makes a tap feel unreliable; and with -webkit-touch-callout left at its
// default, holding a link brings up Safari's own link-preview/callout
// menu — a real "different screen" that has nothing to do with this
// app's routing. Both are closed here at the CSS level, not by adding
// more JS event handling on top of next/link's normal click behavior.
const linkStyle: CSSProperties = {
  touchAction: "manipulation",
  WebkitTouchCallout: "none",
  WebkitUserSelect: "none",
  userSelect: "none",
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={linkStyle}
              className={`flex flex-col items-center gap-0.5 py-1.5 text-xs font-medium ${
                active ? "text-brand-navy" : "text-brand-light"
              }`}
            >
              <Icon filled={active} className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
