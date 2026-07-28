"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ShotType = "desktop" | "tablet" | "mobile";
type Stage = "url" | "analyzing" | "review";

const LOADING_STEPS = [
  "Opening the website…",
  "Capturing desktop screenshot…",
  "Capturing mobile screenshot…",
  "Analyzing the design with AI…",
];

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("url");
  const [liveUrl, setLiveUrl] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [moderationFlag, setModerationFlag] = useState<"safe" | "flagged" | null>(null);
  const [moderationReason, setModerationReason] = useState<string | null>(null);

  const [shots, setShots] = useState<
    Record<ShotType, { url: string | null; thumbnailUrl: string | null; uploading: boolean }>
  >({
    desktop: { url: null, thumbnailUrl: null, uploading: false },
    tablet: { url: null, thumbnailUrl: null, uploading: false },
    mobile: { url: null, thumbnailUrl: null, uploading: false },
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Cycle through loading messages while the backend captures + analyzes.
  useEffect(() => {
    if (stage !== "analyzing") return;
    const id = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, [stage]);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    setAnalyzeError(null);
    setLoadingStep(0);
    setStage("analyzing");

    try {
      const result = await api.analyzeUrl(liveUrl);
      const desktop = result.images.find((i) => i.type === "desktop");
      const mobile = result.images.find((i) => i.type === "mobile");

      setShots((prev) => ({
        ...prev,
        desktop: { url: desktop?.url ?? null, thumbnailUrl: desktop?.thumbnail_url ?? null, uploading: false },
        mobile: { url: mobile?.url ?? null, thumbnailUrl: mobile?.thumbnail_url ?? null, uploading: false },
      }));

      setTitle(result.ai.title ?? "");
      setDescription(result.ai.description ?? "");
      setCategory(result.ai.category ?? "");
      setTagsInput(result.ai.style_tags.join(", "));
      setColors(result.ai.colors);
      setAiAvailable(result.ai.ai_available);
      setModerationFlag(result.ai.moderation_flag);
      setModerationReason(result.ai.moderation_reason);

      setStage("review");
    } catch (err: any) {
      setAnalyzeError(err.message || "Something went wrong capturing that site.");
      setStage("url");
    }
  }

  async function handleManualFile(type: ShotType, file: File) {
    setShots((prev) => ({ ...prev, [type]: { ...prev[type], uploading: true } }));
    try {
      const { url, thumbnail_url } = await api.upload(file);
      setShots((prev) => ({ ...prev, [type]: { url, thumbnailUrl: thumbnail_url, uploading: false } }));
    } catch {
      setShots((prev) => ({ ...prev, [type]: { url: null, thumbnailUrl: null, uploading: false } }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const images = (Object.entries(shots) as [ShotType, typeof shots.desktop][])
      .filter(([, v]) => v.url)
      .map(([type, v]) => ({ type, url: v.url as string, thumbnail_url: v.thumbnailUrl }));

    if (images.length === 0) {
      setSubmitError("No screenshots yet — analyze a URL above or upload one manually.");
      return;
    }
    if (!title.trim()) {
      setSubmitError("Give the design a title.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createDesign({
        title,
        description,
        live_url: liveUrl,
        category,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        images,
        ai_summary: aiAvailable ? description : undefined,
        colors: colors.length ? colors.join(",") : undefined,
        moderation_flag: moderationFlag,
        moderation_reason: moderationReason,
      });
      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Submitted for review</h1>
        <p className="text-neutral-600">
          Thanks! An admin will review your design shortly. Approved designs appear in Explore automatically.
        </p>
        <button onClick={() => router.push("/")} className="mt-8 underline text-sm">
          Back to homepage
        </button>
      </div>
    );
  }

  // ---- Stage 1: URL entry ----
  if (stage === "url") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20">
        <h1 className="font-display text-3xl mb-2 text-center">Submit your design</h1>
        <p className="text-neutral-500 text-sm text-center mb-10">
          Enter a URL and we&apos;ll capture and analyze it automatically.
        </p>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <input
            type="url"
            required
            placeholder="https://example.com"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm"
          />
          {analyzeError && <p className="text-red-600 text-sm">{analyzeError}</p>}
          <button
            type="submit"
            className="w-full bg-ink text-white rounded-full py-3 text-sm hover:opacity-80 transition"
          >
            Analyze Website
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Prefer to upload screenshots yourself?{" "}
          <button onClick={() => setStage("review")} className="underline">
            Skip to manual upload
          </button>
        </p>
      </div>
    );
  }

  // ---- Stage 2: analyzing (loading state) ----
  if (stage === "analyzing") {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-neutral-600 text-sm">{LOADING_STEPS[loadingStep]}</p>
        <p className="text-neutral-400 text-xs mt-2">This can take up to 30 seconds.</p>
      </div>
    );
  }

  // ---- Stage 3: review + edit ----
  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="font-display text-3xl mb-2 text-center">Review your submission</h1>
      <p className="text-neutral-500 text-sm text-center mb-10">
        {aiAvailable
          ? "AI pre-filled these details — edit anything before submitting."
          : "AI analysis isn't configured, so fill in the details below."}
      </p>

      {moderationFlag === "flagged" && (
        <div className="mb-6 border border-amber-300 bg-amber-50 text-amber-800 text-sm rounded-lg px-4 py-3">
          ⚠️ Our automated check flagged this submission for manual review
          {moderationReason ? `: ${moderationReason}` : "."} You can still submit — a
          moderator will take a closer look before it's published.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Screenshots</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["desktop", "tablet", "mobile"] as ShotType[]).map((type) => (
              <label
                key={type}
                className="border border-dashed border-neutral-300 rounded-lg h-32 flex flex-col items-center justify-center text-xs text-neutral-500 cursor-pointer hover:border-ink transition overflow-hidden relative"
              >
                {shots[type].url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shots[type].url as string} alt={type} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="capitalize">{type}</span>
                    <span>{shots[type].uploading ? "Uploading…" : "Drop / click to upload"}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleManualFile(type, e.target.files[0])}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm bg-white"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-500">Tags (comma separated)</label>
          <input
            placeholder="minimal, dark, saas"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        {colors.length > 0 && (
          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500">Detected colors</label>
            <div className="mt-2 flex gap-2">
              {colors.map((c) => (
                <div key={c} className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span
                    className="w-5 h-5 rounded-full border border-neutral-200 inline-block"
                    style={{ backgroundColor: c }}
                  />
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-white rounded-full py-3 text-sm hover:opacity-80 transition disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit for Review"}
        </button>
      </form>
    </div>
  );
}
