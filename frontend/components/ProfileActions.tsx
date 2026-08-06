"use client";

import Link from "next/link";
import { Designer } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import FollowButton from "./FollowButton";

export default function ProfileActions({ designer }: { designer: Designer }) {
  const { user } = useAuth();

  if (user && user.username === designer.username) {
    return (
      <Link
        href="/settings/profile"
        className="inline-block px-5 py-2 rounded-full text-sm border border-neutral-300 hover:border-ink transition whitespace-nowrap"
      >
        Edit profile
      </Link>
    );
  }

  return <FollowButton designer={designer} />;
}
