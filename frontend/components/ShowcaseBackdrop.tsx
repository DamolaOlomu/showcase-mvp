"use client";

import { useEffect, useState } from "react";
import { api, Design } from "@/lib/api";

/**
 * The thing every piece of glass in this UI is looking through isn't an
 * abstract wallpaper — it's the showcase itself. We tile the real design
 * screenshots full-bleed behind the interface, blurred and dimmed, so the
 * navbar/hero/cards read as actual panes of glass held up in front of the
 * gallery, not glass over decoration. Falls back to a soft, static
 * mercury-grey field if there's no gallery data yet (e.g. fresh install).
 */
export default function ShowcaseBackdrop() {
  const [designs, setDesigns] = useState<Design[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getTrendingDesigns(24)
      .then((d) => {
        if (!cancelled) setDesigns(d);
      })
      .catch(() => {
        if (!cancelled) setDesigns([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const covers = (designs || [])
    .map(
      (d) =>
        d.images.find((i) => i.type === "desktop")?.thumbnail_url ||
        d.images.find((i) => i.type === "desktop")?.original_url ||
        d.images[0]?.original_url
    )
    .filter(Boolean) as string[];

  const hasCovers = covers.length >= 6;

  // Repeat to comfortably fill a tiled grid regardless of how many designs exist.
  const tiles = hasCovers
    ? Array.from({ length: 24 }, (_, i) => covers[i % covers.length])
    : [];

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden bg-void pointer-events-none">
      {/* Global optical-distortion filter every .glass element references
          via backdrop-filter: url(#glass-distortion). */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.012"
              numOctaves="2"
              seed="8"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="3" result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale="46"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="mercury-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -3.5"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {hasCovers ? (
        <div
          className="absolute inset-0 grid grid-cols-4 sm:grid-cols-6 gap-0 scale-110 transition-opacity duration-700"
          style={{ filter: "blur(38px) saturate(1.15)", opacity: 0.9 }}
        >
          {tiles.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full h-full object-cover aspect-[4/3]" />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 opacity-[0.55]" style={{ filter: "url(#mercury-goo)" }}>
          <div className="absolute top-[8%] left-[6%] w-[42vw] h-[42vw] rounded-full bg-white blur-3xl animate-drift1" />
          <div className="absolute top-[30%] right-[4%] w-[36vw] h-[36vw] rounded-full bg-[#c7cbd1] blur-3xl animate-drift2" />
          <div className="absolute bottom-[4%] left-[26%] w-[38vw] h-[38vw] rounded-full bg-[#d8dbdf] blur-3xl animate-drift3" />
          <div className="absolute top-[0%] right-[28%] w-[22vw] h-[22vw] rounded-full bg-[#bfc3c9] blur-3xl animate-drift4" />
        </div>
      )}

      {/* Light wash so foreground text stays legible over busy screenshots. */}
      <div className="absolute inset-0 bg-white/35" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, transparent 0%, rgba(200,202,206,0.25) 65%, rgba(190,192,197,0.4) 100%)",
        }}
      />
      <div className="grain-overlay" />
    </div>
  );
}
