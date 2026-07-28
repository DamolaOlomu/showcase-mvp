"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, Design } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DesignDetailActions({ design }: { design: Design }) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(design.liked_by_me);
  const [likeCount, setLikeCount] = useState(design.like_count);
  const [saved, setSaved] = useState(design.saved_by_me);
  const [busy, setBusy] = useState(false);

  async function handleLike() {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      const updated = await api.toggleLike(design.id);
      setLiked(updated.liked_by_me);
      setLikeCount(updated.like_count);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      const updated = await api.toggleSave(design.id);
      setSaved(updated.saved_by_me);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={handleLike}
        disabled={busy}
        className={`px-4 py-2 rounded-full text-sm border transition ${
          liked ? "bg-ink text-white border-ink" : "border-neutral-300 hover:border-ink"
        }`}
      >
        ♥ {liked ? "Liked" : "Like"} · {likeCount}
      </button>
      <button
        onClick={handleSave}
        disabled={busy}
        className={`px-4 py-2 rounded-full text-sm border transition ${
          saved ? "bg-ink text-white border-ink" : "border-neutral-300 hover:border-ink"
        }`}
      >
        🔖 {saved ? "Saved" : "Save"}
      </button>
    </>
  );
}
