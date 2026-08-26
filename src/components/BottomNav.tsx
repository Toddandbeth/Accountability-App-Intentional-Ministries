"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { CheckInIcon, GroupIcon, SettingsIcon } from "@/components/NavIcons";

const ITEMS = [
  { href: "/checkin", label: "Check-in", Icon: CheckInIcon },
  { href: "/dashboard", label: "Dashboard", Icon: GroupIcon },
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
              className={`flex flex-col items-center gap-0.5 py-0.5 text-xs font-medium ${
                active ? "text-brand-navy" : "text-brand-light"
              }`}
            >
              <Icon filled={active} className="h-7 w-7" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
