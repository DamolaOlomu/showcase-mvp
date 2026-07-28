import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import DesignCard from "@/components/DesignCard";
import FollowButton from "@/components/FollowButton";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function DesignerProfilePage({ params }: { params: { username: string } }) {
  const designer = await api.getUser(params.username).catch(() => null);
  if (!designer) return notFound();

  const designs = await api.getUserDesigns(params.username).catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col items-center text-center mb-10">
        <Avatar username={designer.username} avatarUrl={designer.avatar_url} size={72} />
        <h1 className="text-lg font-semibold tracking-tight mt-3">{designer.username}</h1>
        {designer.location && <p className="text-neutral-500 text-sm mt-1">{designer.location}</p>}
        {designer.bio && <p className="text-neutral-700 text-sm mt-3 max-w-md">{designer.bio}</p>}

        <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
          <span>
            <span className="text-ink font-medium">{designer.follower_count}</span> followers
          </span>
          <span>
            <span className="text-ink font-medium">{designer.following_count}</span> following
          </span>
        </div>

        <div className="mt-3">
          <FollowButton designer={designer} />
        </div>

        <div className="flex gap-4 mt-3 text-sm">
          {designer.website_url && (
            <a href={designer.website_url} target="_blank" rel="noreferrer" className="underline text-neutral-600">
              Website
            </a>
          )}
          {designer.twitter_url && (
            <a href={designer.twitter_url} target="_blank" rel="noreferrer" className="underline text-neutral-600">
              Twitter
            </a>
          )}
          {designer.dribbble_url && (
            <a href={designer.dribbble_url} target="_blank" rel="noreferrer" className="underline text-neutral-600">
              Dribbble
            </a>
          )}
        </div>
      </div>

      <h2 className="text-xs font-medium tracking-wide uppercase text-neutral-500 mb-3">
        {designs.length} {designs.length === 1 ? "Design" : "Designs"}
      </h2>

      {designs.length === 0 ? (
        <p className="text-neutral-500 text-sm">No published designs yet.</p>
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
