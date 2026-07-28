"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, Designer } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function FollowButton({ designer }: { designer: Designer }) {
  const { user } = useAuth();
  const router = useRouter();
  const [followed, setFollowed] = useState(designer.followed_by_me);
  const [followerCount, setFollowerCount] = useState(designer.follower_count);
  const [busy, setBusy] = useState(false);

  // Don't show a follow button on your own profile.
  if (user && user.username === designer.username) return null;

  async function handleClick() {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      const updated = await api.toggleFollow(designer.username);
      setFollowed(updated.followed_by_me);
      setFollowerCount(updated.follower_count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`px-5 py-2 rounded-full text-sm border transition ${
        followed ? "bg-ink text-white border-ink" : "border-neutral-300 hover:border-ink"
      }`}
    >
      {followed ? "Following" : "Follow"} · {followerCount}
    </button>
  );
}
