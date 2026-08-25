"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Defaults tuned for the check-in question titles (Round 13/14): the
// ceiling is deliberately capped well below the section-header tier
// (20px), since per-title shrinking means a short title like "God — My
// Daily Walk with God" barely needs to shrink at all, and an uncapped
// ceiling let it render dramatically larger than its longer neighbors.
// Capping at the body-text tier (17px) keeps every title's rendered size
// close to the others regardless of its own length. Other call sites
// (e.g. the check-in page title) pass their own maxFontSize/minFontSize
// to fit their own tier instead. Either way, a title that still wouldn't
// fit even at the floor size falls back to an ellipsis rather than
// wrapping or breaking the layout.
const DEFAULT_MAX_FONT_SIZE = 17;
const DEFAULT_MIN_FONT_SIZE = 14;
const STEP = 0.5;

interface AutoShrinkTitleProps {
  text: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  as?: "h1" | "h3";
}

export function AutoShrinkTitle({
  text,
  className,
  maxFontSize = DEFAULT_MAX_FONT_SIZE,
  minFontSize = DEFAULT_MIN_FONT_SIZE,
  as: Tag = "h3",
}: AutoShrinkTitleProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const span = textRef.current;
    if (!container || !span) return;

    function fit() {
      if (!container || !span) return;
      let size = maxFontSize;
      span.style.fontSize = `${size}px`;
      while (span.scrollWidth > container.clientWidth && size > minFontSize) {
        size -= STEP;
        span.style.fontSize = `${size}px`;
      }
      setFontSize(size);
    }

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text, maxFontSize, minFontSize]);

  return (
    <Tag ref={containerRef} className="w-full overflow-hidden">
      <span
        ref={textRef}
        className={`inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${className ?? ""}`}
        style={{ fontSize }}
      >
        {text}
      </span>
    </Tag>
  );
}
