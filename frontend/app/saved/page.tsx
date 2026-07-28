"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Design } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import DesignCard from "@/components/DesignCard";

export default function SavedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getSavedDesigns()
      .then(setDesigns)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-lg font-semibold tracking-tight mb-1">Saved</h1>
      <p className="text-neutral-500 text-sm mb-6">Designs you&apos;ve bookmarked to come back to.</p>

      {fetching ? (
        <div className="columns-2 sm:columns-3 xl:columns-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-2.5 break-inside-avoid animate-pulse">
              <div className="bg-neutral-100 rounded-sm aspect-[4/3]" />
            </div>
          ))}
        </div>
      ) : designs.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          Nothing saved yet — hit 🔖 on a design you like to bookmark it here.
        </p>
      ) : (
        <div className="columns-2 sm:columns-3 xl:columns-4 gap-2.5">
          {designs.map((d) => (
            <DesignCard key={d.id} design={d} />
          ))}
        </div>
      )}
    </div>
  );
}
