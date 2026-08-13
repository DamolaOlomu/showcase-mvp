"use client";

import { useEffect, useRef, useState } from "react";

const BASE_TILT = -10; // degrees — a normal pointer's resting angle
const W = 26;
const H = 34;
// Same coordinate space as the CSS clip-path in globals.css — kept in
// sync so the glass fill and the bright rim outline trace one shape.
const ARROW_PATH = `M${W * 0.071} ${H * 0.056} L${W * 0.071} ${H * 0.722} L${W * 0.321} ${
  H * 0.556
} L${W * 0.464} ${H * 0.833} L${W * 0.607} ${H * 0.778} L${W * 0.464} ${H * 0.5} L${
  W * 0.786
} ${H * 0.5} Z`;

/**
 * A real cursor, just rebuilt in glass: a tilted pointer silhouette,
 * mostly transparent, refracting whatever's behind it (same
 * url(#glass-distortion) every panel uses) with a bright thin rim tracing
 * the outline — a locket, not a sticker. Position eases toward the real
 * pointer with a light spring lag; the tilt stays fixed like a normal
 * cursor rather than rotating with movement. Desktop only.
 */
export default function LiquidCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const hoveringRef = useRef(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;
    setEnabled(true);
    document.documentElement.classList.add("has-liquid-cursor");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    const scale = { current: 1 };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      const el = (e.target as HTMLElement)?.closest?.(
        'a, button, input, textarea, [role="button"], .cursor-hover'
      );
      const isHovering = !!el;
      hoveringRef.current = isHovering;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;

      const targetScale = hoveringRef.current ? 1.3 : 1;
      scale.current += (targetScale - scale.current) * 0.18;

      const node = rootRef.current;
      if (node) {
        node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${BASE_TILT}deg) scale(${scale.current})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-liquid-cursor");
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed top-0 left-0 z-[999] pointer-events-none"
      style={{ width: W, height: H, marginLeft: -W * 0.15, marginTop: -H * 0.06 }}
    >
      <div className="liquid-cursor-fill" />
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0"
        style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.6))" }}
      >
        <path d={ARROW_PATH} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
