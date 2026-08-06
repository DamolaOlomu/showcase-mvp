import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import DesignCard from "@/components/DesignCard";
import Avatar from "@/components/Avatar";
import ProfileActions from "@/components/ProfileActions";

export const dynamic = "force-dynamic";

const SOCIAL_LINKS: { key: "website_url" | "twitter_url" | "dribbble_url" | "instagram_url" | "linkedin_url" | "github_url"; label: string }[] = [
  { key: "website_url", label: "Website" },
  { key: "twitter_url", label: "Twitter" },
  { key: "dribbble_url", label: "Dribbble" },
  { key: "instagram_url", label: "Instagram" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "github_url", label: "GitHub" },
];

export default async function DesignerProfilePage({ params }: { params: { username: string } }) {
  const designer = await api.getUser(params.username).catch(() => null);
  if (!designer) return notFound();

  const designs = await api.getUserDesigns(params.username).catch(() => []);
  const socialLinks = SOCIAL_LINKS.filter((s) => designer[s.key]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Cover photo */}
      <div className="relative mb-14 sm:mb-16 -mx-4 sm:mx-0">
        <div className="w-full h-32 sm:h-48 sm:rounded-xl bg-neutral-100 overflow-hidden">
          {designer.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={designer.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200" />
          )}
        </div>
        <div className="absolute left-4 sm:left-6 -bottom-10 sm:-bottom-12 ring-4 ring-paper rounded-full">
          <Avatar username={designer.username} avatarUrl={designer.avatar_url} size={80} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10 px-1">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">{designer.username}</h1>
          {designer.location && <p className="text-neutral-500 text-sm mt-1">{designer.location}</p>}
          {designer.bio && <p className="text-neutral-700 text-sm mt-3 max-w-md break-words">{designer.bio}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-neutral-500">
            <span>
              <span className="text-ink font-medium">{designer.follower_count}</span> followers
            </span>
            <span>
              <span className="text-ink font-medium">{designer.following_count}</span> following
            </span>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={designer[s.key] as string}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-neutral-600 hover:text-ink transition"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <ProfileActions designer={designer} />
        </div>
      </div>

      <h2 className="text-xs font-medium tracking-wide uppercase text-neutral-500 mb-3 px-1">
        {designs.length} {designs.length === 1 ? "Design" : "Designs"}
      </h2>

      {designs.length === 0 ? (
        <p className="text-neutral-500 text-sm px-1">No published designs yet.</p>
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
