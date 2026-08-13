"use client";

import { useEffect, useRef } from "react";

type BlobConfig = {
  size: number;
  baseX: number; // idle orbit center, in vw/vh percent
  baseY: number;
  orbitX: number; // idle orbit radius
  orbitY: number;
  speed: number; // idle orbit angular speed
  phase: number;
  reactivity: number; // how strongly it's pulled toward the cursor, 0..1
  morphClass: string;
};

const BLOBS: BlobConfig[] = [
  { size: 220, baseX: 18, baseY: 24, orbitX: 6, orbitY: 5, speed: 0.18, phase: 0, reactivity: 0.22, morphClass: "blob-morph-a" },
  { size: 130, baseX: 78, baseY: 18, orbitX: 5, orbitY: 7, speed: 0.24, phase: 1.4, reactivity: 0.34, morphClass: "blob-morph-b" },
  { size: 300, baseX: 62, baseY: 62, orbitX: 7, orbitY: 4, speed: 0.13, phase: 2.6, reactivity: 0.14, morphClass: "blob-morph-c" },
  { size: 90, baseX: 30, baseY: 74, orbitX: 4, orbitY: 6, speed: 0.3, phase: 3.7, reactivity: 0.4, morphClass: "blob-morph-b" },
  { size: 170, baseX: 88, baseY: 70, orbitX: 5, orbitY: 5, speed: 0.2, phase: 5.0, reactivity: 0.26, morphClass: "blob-morph-a" },
];

/**
 * Floating glass bubbles, not a decorative wallpaper — each one is an
 * actual pane of glass (same url(#glass-distortion) refraction as the
 * navbar/hero) that drifts on its own slow orbit and eases toward the
 * cursor. Position is driven imperatively via refs on every frame so the
 * cursor-follow stays smooth without triggering React re-renders.
 */
export default function LiquidBlobs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouse = useRef({ x: 0.5, y: 0.5, active: false });
  const current = useRef(BLOBS.map((b) => ({ x: b.baseX, y: b.baseY })));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
      mouse.current.active = true;
    };
    const onLeave = () => {
      mouse.current.active = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const el = containerRef.current;
      if (el) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        BLOBS.forEach((b, i) => {
          const idleX = b.baseX + Math.sin(t * b.speed + b.phase) * b.orbitX;
          const idleY = b.baseY + Math.cos(t * b.speed * 0.8 + b.phase) * b.orbitY;

          const mouseXPct = mouse.current.x * 100;
          const mouseYPct = mouse.current.y * 100;

          const pull = mouse.current.active ? b.reactivity : 0;
          const targetX = idleX + (mouseXPct - idleX) * pull * 0.5;
          const targetY = idleY + (mouseYPct - idleY) * pull * 0.5;

          const cur = current.current[i];
          cur.x += (targetX - cur.x) * 0.045;
          cur.y += (targetY - cur.y) * 0.045;

          const node = blobRefs.current[i];
          if (node) {
            const px = (cur.x / 100) * w;
            const py = (cur.y / 100) * h;
            node.style.transform = `translate3d(${px - b.size / 2}px, ${py - b.size / 2}px, 0)`;
          }
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} aria-hidden className="fixed inset-0 z-[2] overflow-hidden pointer-events-none">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          ref={(el) => {
            blobRefs.current[i] = el;
          }}
          className="absolute top-0 left-0 will-change-transform"
          style={{ width: b.size, height: b.size }}
        >
          <div className={`liquid-blob-surface glass-edge w-full h-full ${b.morphClass}`} />
        </div>
      ))}
    </div>
  );
}
