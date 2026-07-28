import Link from "next/link";
import { api } from "@/lib/api";
import DesignGrid from "@/components/DesignGrid";
import CategoryTabs from "@/components/CategoryTabs";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string };
}) {
  const categories = await api.categories().catch(() => [] as string[]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-lg font-semibold tracking-tight mb-4">Explore</h1>

      {searchParams.tag && (
        <p className="text-neutral-500 text-sm mb-6">
          Tagged <span className="text-ink">#{searchParams.tag}</span> ·{" "}
          <Link href="/explore" className="underline">
            clear
          </Link>
        </p>
      )}

      {!searchParams.tag && <CategoryTabs categories={categories} active={searchParams.category} />}

      <DesignGrid category={searchParams.tag ? undefined : searchParams.category} tag={searchParams.tag} />
    </div>
  );
}
