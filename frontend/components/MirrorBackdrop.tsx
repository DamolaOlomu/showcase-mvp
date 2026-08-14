"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBackdropContext } from "@/lib/backdrop-context";

/**
 * What's behind the glass is never decorative — it's a mirror of what the
 * page is actually showing. Pages push their own images in via
 * <BackdropSync> (see lib/backdrop-context); this component just renders
 * whatever's current. A single image (a design's own detail page) becomes
 * a large reflection — the image, then a faded vertical mirror of itself
 * beneath, like glass over water. Several images (the homepage grid) tile
 * as a blurred mosaic of that exact same set. Falls back to a generic
 * trending mirror only when a page hasn't supplied anything (e.g. login).
 */
export default function MirrorBackdrop() {
  const { images: pageImages } = useBackdropContext();
  const [fallback, setFallback] = useState<string[]>([]);

  useEffect(() => {
    if (pageImages.length > 0) return;
    let cancelled = false;
    api
      .getTrendingDesigns(16)
      .then((d) => {
        if (cancelled) return;
        const covers = d
          .map(
            (x) =>
              x.images.find((i) => i.type === "desktop")?.thumbnail_url ||
              x.images.find((i) => i.type === "desktop")?.original_url ||
              x.images[0]?.original_url
          )
          .filter(Boolean) as string[];
        setFallback(covers);
      })
      .catch(() => setFallback([]));
    return () => {
      cancelled = true;
    };
  }, [pageImages.length]);

  const images = pageImages.length > 0 ? pageImages : fallback;
  const single = images.length > 0 && images.length <= 2;
  const hasImages = images.length > 0;

  const tiles = hasImages && !single ? Array.from({ length: 15 }, (_, i) => images[i % images.length]) : [];

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
        </defs>
      </svg>

      {single && (
        <div className="absolute inset-0 flex flex-col">
          <div className="relative flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt=""
              className="w-full h-full object-cover scale-110"
              style={{ filter: "blur(11px) saturate(1.15)" }}
            />
          </div>
          {/* The mirror: same image, flipped, fading out — a reflection. */}
          <div className="relative flex-1 -mt-px overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt=""
              className="w-full h-full object-cover scale-110"
              style={{
                filter: "blur(11px) saturate(1.15)",
                transform: "scaleY(-1)",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 75%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 75%)",
              }}
            />
          </div>
        </div>
      )}

      {!single && hasImages && (
        <div
          className="absolute inset-0 grid grid-cols-3 sm:grid-cols-5 gap-0 scale-110"
          style={{ filter: "blur(11px) saturate(1.1)" }}
        >
          {tiles.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full h-full object-cover aspect-[4/3]" />
          ))}
        </div>
      )}

      {/* Light wash so foreground text stays legible over busy screenshots. */}
      <div className="absolute inset-0 bg-white/45" />
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
