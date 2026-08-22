"use client";

import { useLayoutEffect, useRef, useState } from "react";

// The section-header tier (20px) is the ceiling; titles only shrink below
// it as far as needed to stay on one line, never below MIN_FONT_SIZE. A
// title that still wouldn't fit even at the floor size falls back to an
// ellipsis rather than wrapping or breaking the card layout.
const MAX_FONT_SIZE = 20;
const MIN_FONT_SIZE = 14;
const STEP = 0.5;

interface AutoShrinkTitleProps {
  text: string;
  className?: string;
}

export function AutoShrinkTitle({ text, className }: AutoShrinkTitleProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const span = textRef.current;
    if (!container || !span) return;

    function fit() {
      if (!container || !span) return;
      let size = MAX_FONT_SIZE;
      span.style.fontSize = `${size}px`;
      while (span.scrollWidth > container.clientWidth && size > MIN_FONT_SIZE) {
        size -= STEP;
        span.style.fontSize = `${size}px`;
      }
      setFontSize(size);
    }

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  return (
    <h3 ref={containerRef} className="w-full overflow-hidden">
      <span
        ref={textRef}
        className={`inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${className ?? ""}`}
        style={{ fontSize }}
      >
        {text}
      </span>
    </h3>
  );
}
