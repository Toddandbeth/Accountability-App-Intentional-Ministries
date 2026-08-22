"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 17a8 8 0 0 1 16 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17 16 11" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" stroke="none" />
      <path
        d="M4.5 17h1.2M18.3 17h1.2M6.6 11.3l.85.85M17.4 11.3l-.85.85M12 6.5v1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
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
              className={`flex flex-col items-center gap-1 py-2.5 text-sm font-medium ${
                active ? "text-brand-navy" : "text-brand-light"
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
