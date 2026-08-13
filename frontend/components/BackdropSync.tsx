"use client";

import { useSetBackdrop } from "@/lib/backdrop-context";

export default function BackdropSync({ images }: { images: string[] }) {
  useSetBackdrop(images);
  return null;
}
