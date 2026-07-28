import Link from "next/link";
import { api } from "@/lib/api";
import DesignCard from "@/components/DesignCard";
import RecommendedSection from "@/components/RecommendedSection";
import HeroHeader from "@/components/HeroHeader";
import HomeGrid from "@/components/HomeGrid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof api.getTrendingDesigns>> = [];
  try {
    items = await api.getTrendingDesigns(16);
  } catch {
    // Backend not reachable yet — page still renders.
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <HeroHeader />

      <RecommendedSection />

      {items.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No designs published yet. Be the first to{" "}
          <Link href="/submit" className="underline">
            submit one
          </Link>
          .
        </p>
      ) : (
        <HomeGrid items={items} />
      )}
    </div>
  );
}
