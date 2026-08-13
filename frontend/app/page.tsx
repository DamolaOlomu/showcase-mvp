import Link from "next/link";
import { api } from "@/lib/api";
import DesignCard from "@/components/DesignCard";
import RecommendedSection from "@/components/RecommendedSection";
import HomeGrid from "@/components/HomeGrid";
import BackdropSync from "@/components/BackdropSync";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof api.getTrendingDesigns>> = [];
  try {
    items = await api.getTrendingDesigns(16);
  } catch {
    // Backend not reachable yet — page still renders.
  }

  const covers = items
    .map(
      (d) =>
        d.images.find((i) => i.type === "desktop")?.thumbnail_url ||
        d.images.find((i) => i.type === "desktop")?.original_url ||
        d.images[0]?.original_url
    )
    .filter(Boolean) as string[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <BackdropSync images={covers} />
      <RecommendedSection />

      {items.length > 0 ? (
        <HomeGrid items={items} />
      ) : (
        <p className="text-mist-dim text-sm">
          No designs published yet. Be the first to{" "}
          <Link href="/submit" className="underline decoration-mist/30 underline-offset-4">
            submit one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
