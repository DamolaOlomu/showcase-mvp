import DesignGrid from "@/components/DesignGrid";

export const dynamic = "force-dynamic";

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-lg font-semibold tracking-tight mb-1">Search</h1>
      <p className="text-neutral-500 mb-6 text-sm">
        {q ? (
          <>
            Results for <span className="text-ink">&ldquo;{q}&rdquo;</span>
          </>
        ) : (
          "Enter a search term from the homepage."
        )}
      </p>

      {q ? (
        <DesignGrid q={q} emptyMessage="No matching designs." />
      ) : (
        <p className="text-neutral-500 text-sm">Try searching for a style, category, or tag.</p>
      )}
    </div>
  );
}
