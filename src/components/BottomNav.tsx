"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  filled: boolean;
}

function HomeIcon({ filled, ...props }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 3.3 3 11h2v8a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-8h2L12 3.3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardIcon({ filled, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      {filled ? (
        <path d="M3 19a9 9 0 0 1 18 0h-2.2a6.8 6.8 0 0 0-13.6 0H3Z" fill="currentColor" stroke="none" />
      ) : (
        <path d="M3 19a9 9 0 0 1 18 0" strokeLinecap="round" strokeLinejoin="round" />
      )}
      <path d="M12 19 17 10.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
      {!filled && (
        <path
          d="M3.8 19h1.4M18.8 19h1.4M6.2 12.2l1 1M17.8 12.2l-1 1M12 4.5v1.6"
          strokeLinecap="round"
        />
      )}
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
  { href: "/checkin", label: "Home", Icon: HomeIcon },
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
              className={`flex flex-col items-center gap-1 py-2.5 text-[17px] font-medium ${
                active ? "text-brand-navy" : "text-brand-light"
              }`}
            >
              <Icon filled={active} className="h-6 w-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
