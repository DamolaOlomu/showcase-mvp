"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export default function ViewTracker({ designId }: { designId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Fire-and-forget: a failed view count should never affect the page.
    api.trackView(designId).catch(() => {});
  }, [designId]);

  return null;
}
