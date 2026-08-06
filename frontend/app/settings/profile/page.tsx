"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Avatar from "@/components/Avatar";

export default function EditProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [dribbbleUrl, setDribbbleUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
    setWebsiteUrl(user.website_url ?? "");
    setTwitterUrl(user.twitter_url ?? "");
    setDribbbleUrl(user.dribbble_url ?? "");
    setInstagramUrl(user.instagram_url ?? "");
    setLinkedinUrl(user.linkedin_url ?? "");
    setGithubUrl(user.github_url ?? "");
    setAvatarUrl(user.avatar_url ?? null);
    setCoverUrl(user.cover_url ?? null);
  }, [user]);

  async function handleAvatarFile(file: File) {
    setAvatarUploading(true);
    setError(null);
    try {
      const { url } = await api.upload(file, "avatar");
      setAvatarUrl(url);
    } catch (err: any) {
      setError(err.message || "Couldn't upload that image.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleCoverFile(file: File) {
    setCoverUploading(true);
    setError(null);
    try {
      const { url } = await api.upload(file, "cover");
      setCoverUrl(url);
    } catch (err: any) {
      setError(err.message || "Couldn't upload that image.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateUser(user.username, {
        bio,
        location,
        website_url: websiteUrl,
        twitter_url: twitterUrl,
        dribbble_url: dribbbleUrl,
        instagram_url: instagramUrl,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        avatar_url: avatarUrl ?? "",
        cover_url: coverUrl ?? "",
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl mb-1">Edit profile</h1>
      <p className="text-neutral-500 text-sm mb-8">
        This is how other people will see you on Showcase.
      </p>

      {/* Cover + avatar preview */}
      <div className="relative mb-14 sm:mb-16">
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="relative w-full h-32 sm:h-44 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200 block group"
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
              No cover photo
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium px-3 py-1.5 bg-black/50 rounded-full">
              {coverUploading ? "Uploading…" : "Change cover photo"}
            </span>
          </div>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleCoverFile(e.target.files[0])}
        />

        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="absolute left-4 sm:left-6 -bottom-10 sm:-bottom-12 group"
        >
          <div className="ring-4 ring-paper rounded-full relative">
            <Avatar username={user.username} avatarUrl={avatarUrl} size={80} />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-medium text-center px-1">
                {avatarUploading ? "…" : "Change"}
              </span>
            </div>
          </div>
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAvatarFile(e.target.files[0])}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="A short description about you"
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-3">
            Social profiles
          </label>
          <div className="space-y-3">
            <SocialInput label="Website" placeholder="https://yoursite.com" value={websiteUrl} onChange={setWebsiteUrl} />
            <SocialInput label="Twitter / X" placeholder="https://twitter.com/you" value={twitterUrl} onChange={setTwitterUrl} />
            <SocialInput label="Dribbble" placeholder="https://dribbble.com/you" value={dribbbleUrl} onChange={setDribbbleUrl} />
            <SocialInput label="Instagram" placeholder="https://instagram.com/you" value={instagramUrl} onChange={setInstagramUrl} />
            <SocialInput label="LinkedIn" placeholder="https://linkedin.com/in/you" value={linkedinUrl} onChange={setLinkedinUrl} />
            <SocialInput label="GitHub" placeholder="https://github.com/you" value={githubUrl} onChange={setGithubUrl} />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Profile saved.</p>}

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:justify-end pt-2">
          <button
            type="button"
            onClick={() => router.push(`/designer/${user.username}`)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm border border-neutral-300 hover:border-ink transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || avatarUploading || coverUploading}
            className="w-full sm:w-auto px-5 py-2.5 bg-ink text-white rounded-full text-sm hover:opacity-80 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SocialInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
      <label className="text-sm text-neutral-600 sm:w-24 shrink-0">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm"
      />
    </div>
  );
}
