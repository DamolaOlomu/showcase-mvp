import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { api } from "@/lib/api";
import DesignDetailActions from "./DesignDetailActions";
import ScreenshotViewer from "@/components/ScreenshotViewer";
import DesignCard from "@/components/DesignCard";
import ViewTracker from "./ViewTracker";
import BackdropSync from "@/components/BackdropSync";

export const dynamic = "force-dynamic";

// Note: generateMetadata and the page component below both independently
// call api.getDesign() — Next.js's fetch request memoization did NOT
// dedupe these in testing (confirmed by measuring view_count before/after
// a single page load), so view counting deliberately does NOT live on this
// GET endpoint. See ViewTracker below and the /view endpoint in the
// backend for why.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const design = await api.getDesign(params.slug).catch(() => null);
  if (!design) return { title: "Design not found — Showcase" };

  const image = design.images.find((i) => i.type === "desktop")?.original_url || design.images[0]?.original_url;
  const description =
    design.description || design.ai_summary || `${design.title} — a website design on Showcase.`;

  return {
    title: `${design.title} — Showcase`,
    description,
    openGraph: {
      title: design.title,
      description,
      images: image ? [{ url: image }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: design.title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function DesignDetailPage({ params }: { params: { slug: string } }) {
  const design = await api.getDesign(params.slug).catch(() => null);
  if (!design) return notFound();

  const similar = await api.getSimilarDesigns(params.slug, 3).catch(() => []);

  const backdropImages = design.images
    .map((i) => i.thumbnail_url || i.original_url)
    .filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <BackdropSync images={backdropImages} />
      <ViewTracker designId={design.id} />

      <Link href="/explore" className="text-sm text-neutral-500 hover:opacity-70">
        ← Back
      </Link>

      <div className="mt-6 mb-10">
        <h1 className="font-display text-3xl md:text-4xl">{design.title}</h1>
        {design.category && <p className="text-neutral-500 mt-1">{design.category}</p>}
        <Link
          href={`/designer/${design.designer.username}`}
          className="inline-block mt-2 text-sm hover:opacity-60"
        >
          Designed by @{design.designer.username}
        </Link>

        {design.description && <p className="mt-4 text-neutral-700 max-w-xl">{design.description}</p>}

        <div className="mt-6 flex items-center gap-3">
          <DesignDetailActions design={design} />
          {design.live_url && (
            <a
              href={design.live_url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 border border-ink rounded-full text-sm hover:bg-ink hover:text-white transition"
            >
              Visit Live Website ↗
            </a>
          )}
        </div>

        {design.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {design.tags.map((t) => (
              <Link
                key={t.id}
                href={`/explore?tag=${encodeURIComponent(t.name)}`}
                className="text-xs px-2.5 py-1 bg-neutral-100 rounded-full text-neutral-600 hover:bg-neutral-200 transition"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ScreenshotViewer images={design.images} title={design.title} designId={design.id} />

      {similar.length > 0 && (
        <div className="mt-20">
          <h2 className="text-xs font-medium tracking-wide uppercase text-neutral-500 mb-3">You might also like</h2>
          <div className="columns-2 sm:columns-3 gap-2.5">
            {similar.map((d) => (
              <DesignCard key={d.id} design={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
