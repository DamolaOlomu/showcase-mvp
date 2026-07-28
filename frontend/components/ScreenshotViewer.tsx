"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DesignImage } from "@/lib/api";

const ORDER: DesignImage["type"][] = ["desktop", "tablet", "mobile"];

export default function ScreenshotViewer({
  images,
  title,
  designId,
}: {
  images: DesignImage[];
  title: string;
  designId?: string;
}) {
  const available = ORDER.filter((type) => images.some((i) => i.type === type));
  const [active, setActive] = useState(available[0]);

  if (available.length === 0) {
    return <p className="text-neutral-500 text-sm">No screenshots uploaded yet.</p>;
  }

  const img = images.find((i) => i.type === active)!;

  return (
    <div>
      {available.length > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          {available.map((type) => (
            <button
              key={type}
              onClick={() => setActive(type)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wide border transition ${
                active === type
                  ? "bg-ink text-white border-ink"
                  : "border-neutral-300 text-neutral-500 hover:border-ink hover:text-ink"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
        <motion.img
          key={img.id}
          layoutId={designId ? `design-photo-${designId}` : undefined}
          transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
          src={img.optimized_url || img.original_url}
          alt={`${title} — ${active} screenshot`}
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
}
