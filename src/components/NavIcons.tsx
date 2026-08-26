import type { SVGProps } from "react";

export interface NavIconProps extends SVGProps<SVGSVGElement> {
  filled: boolean;
}

// Document + checkmark badge, shape/style based on the provided reference
// (design-references/checkin-icon-reference.png), recolored to the app's
// own brand tokens rather than dropped in as a literal asset. Shared
// between BottomNav (tab icon) and Help & Tips (leading list icon, Round
// 19) rather than defined twice.
export function CheckInIcon({ filled, ...props }: NavIconProps) {
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} {...props}>
      <rect x="5" y="4" width="11" height="16" rx="2" strokeLinejoin="round" />
      <path d="M8.5 9h4M8.5 12.5h4M8.5 16h2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="4" />
      <path d="M15.2 17.1 16.4 18.3 18.7 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Round 19: three-person "group" composition (one centered/forward, two
// smaller ones behind) replacing Round 18's two-person version, which
// read ambiguously. Back figures are drawn first and solid; the front
// figure's white separation stroke is what keeps it visually distinct
// from them once everything is filled, the same seam trick used
// elsewhere (Check-in's checkmark badge, Settings' gear hole).
export function GroupIcon({ filled, ...props }: NavIconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
        <circle cx="5.8" cy="8.3" r="2" />
        <path d="M2.3 17.8c.3-2.9 1.7-4.6 3.7-4.9 1 0 1.9.2 2.6.7-1.7 1.6-2.6 3.9-2.6 6.9v.8H2.3v-.8Z" />
        <circle cx="18.2" cy="8.3" r="2" />
        <path d="M21.7 17.8c-.3-2.9-1.7-4.6-3.7-4.9-1 0-1.9.2-2.6.7 1.7 1.6 2.6 3.9 2.6 6.9v.8h3.7v-.8Z" />
        <circle cx="12" cy="8.8" r="3.1" stroke="white" strokeWidth={1.2} />
        <path
          d="M5.1 21.3v-.3c0-4.1 2.7-6.9 6.9-6.9s6.9 2.8 6.9 6.9v.3"
          stroke="white"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} {...props}>
      <circle cx="5.8" cy="8.3" r="2" />
      <path d="M2.3 17.5c.3-2.6 1.7-4.3 3.7-4.6" strokeLinecap="round" />
      <circle cx="18.2" cy="8.3" r="2" />
      <path d="M21.7 17.5c-.3-2.6-1.7-4.3-3.7-4.6" strokeLinecap="round" />
      <circle cx="12" cy="8.8" r="3" />
      <path d="M5.3 21c0-3.9 2.6-6.6 6.7-6.6s6.7 2.7 6.7 6.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsIcon({ filled, ...props }: NavIconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.4 13a7.6 7.6 0 0 0 .1-2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3h-6l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4L4.5 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 21h6l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.1Z" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13a7.6 7.6 0 0 0 .1-2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3h-6l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4L4.5 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1L9 21h6l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Leader Guide's leading icon (Round 19) — a single consistent style, no
// filled/outline state needed since this only ever appears as a small
// static list icon, never a tab that toggles active/inactive.
export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} {...props}>
      <path d="M6 21V4" strokeLinecap="round" />
      <path
        d="M6 4.5c1.5-1 3.5-1 5 0s3.5 1 5 0v8.2c-1.5 1-3.5 1-5 0s-3.5-1-5 0Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Questions & Answers' leading icon (Round 19) — same "static list icon"
// reasoning as FlagIcon above.
export function QuestionCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path
        d="M9.3 9.6c.2-1.6 1.6-2.6 3.1-2.4 1.4.2 2.5 1.2 2.5 2.5 0 1.8-2.5 2.1-2.5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
