"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type BackdropContextValue = {
  images: string[];
  setImages: (images: string[]) => void;
};

const BackdropContext = createContext<BackdropContextValue | null>(null);

export function BackdropProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  return (
    <BackdropContext.Provider value={{ images, setImages }}>{children}</BackdropContext.Provider>
  );
}

export function useBackdropContext() {
  const ctx = useContext(BackdropContext);
  if (!ctx) throw new Error("useBackdropContext must be used within BackdropProvider");
  return ctx;
}

/**
 * Call from any page (via the <BackdropSync> client component below) to
 * make the global backdrop mirror that page's own content instead of a
 * generic, unrelated set of designs. Clears on unmount so navigating away
 * doesn't leave a stale reflection behind.
 */
export function useSetBackdrop(images: string[]) {
  const { setImages } = useBackdropContext();
  const key = images.join("|");
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    setImages(images);
    return () => setImages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
