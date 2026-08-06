const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DesignImage = {
  id: string;
  type: "desktop" | "tablet" | "mobile";
  original_url: string;
  optimized_url?: string | null;
  thumbnail_url?: string | null;
};

export type Tag = { id: string; name: string };

export type Designer = {
  id: string;
  username: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  dribbble_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  location?: string | null;
  created_at: string;
  follower_count: number;
  following_count: number;
  followed_by_me: boolean;
  is_admin: boolean;
  is_suspended: boolean;
};

export type UserUpdate = {
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  website_url?: string;
  twitter_url?: string;
  dribbble_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  github_url?: string;
  location?: string;
};

export type AdminUser = Designer & { email: string };

export type Design = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  live_url?: string | null;
  category?: string | null;
  status: "pending" | "approved" | "rejected";
  ai_summary?: string | null;
  colors?: string | null;
  moderation_flag?: "safe" | "flagged" | null;
  moderation_reason?: string | null;
  featured: boolean;
  view_count: number;
  created_at: string;
  published_at?: string | null;
  designer: Designer;
  images: DesignImage[];
  tags: Tag[];
  like_count: number;
  save_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
};

export type DesignListResponse = {
  items: Design[];
  total: number;
  page: number;
  page_size: number;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("showcase_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("showcase_token", token);
  else localStorage.removeItem("showcase_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (data: { username: string; email: string; password: string }) =>
    request<{ access_token: string; user: Designer }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: Designer }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<Designer>("/api/auth/me"),

  getUser: (username: string) => request<Designer>(`/api/users/${username}`),

  getUserDesigns: (username: string) => request<Design[]>(`/api/users/${username}/designs`),

  updateUser: (username: string, data: UserUpdate) =>
    request<Designer>(`/api/users/${username}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggleFollow: (username: string) =>
    request<Designer>(`/api/users/${username}/follow`, { method: "POST" }),

  getSavedDesigns: () => request<Design[]>("/api/designs/meta/saved"),

  getRecommendedDesigns: (limit = 12) =>
    request<Design[]>(`/api/designs/meta/recommended?limit=${limit}`),

  getTrendingDesigns: (limit = 12) =>
    request<Design[]>(`/api/designs/meta/trending?limit=${limit}`),

  getSimilarDesigns: (slug: string, limit = 6) =>
    request<Design[]>(`/api/designs/${slug}/similar?limit=${limit}`),

  listDesigns: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<DesignListResponse>(`/api/designs${qs ? `?${qs}` : ""}`);
  },

  getDesign: (slug: string) => request<Design>(`/api/designs/${slug}`),

  createDesign: (data: {
    title: string;
    description?: string;
    live_url?: string;
    category?: string;
    tags?: string[];
    images?: { type: string; url: string; thumbnail_url?: string | null }[];
    ai_summary?: string;
    colors?: string;
    moderation_flag?: string | null;
    moderation_reason?: string | null;
  }) =>
    request<Design>("/api/designs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  toggleLike: (id: string) => request<Design>(`/api/designs/${id}/like`, { method: "POST" }),
  toggleSave: (id: string) => request<Design>(`/api/designs/${id}/save`, { method: "POST" }),
  trackView: (id: string) => request<void>(`/api/designs/${id}/view`, { method: "POST" }),

  categories: () => request<string[]>("/api/designs/meta/categories"),

  analyzeUrl: (url: string) =>
    request<{
      images: { type: "desktop" | "mobile"; url: string; thumbnail_url: string | null }[];
      ai: {
        title: string | null;
        category: string | null;
        style_tags: string[];
        colors: string[];
        description: string | null;
        moderation_flag: "safe" | "flagged" | null;
        moderation_reason: string | null;
        ai_available: boolean;
      };
    }>("/api/capture/analyze", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  upload: async (file: File, kind: "design" | "avatar" | "cover" = "design") => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; thumbnail_url: string | null }>(
      `/api/upload?kind=${kind}`,
      { method: "POST", body: form }
    );
  },

  // ---- Admin ----

  adminListDesigns: (status?: string) =>
    request<Design[]>(`/api/admin/designs${status ? `?status=${status}` : ""}`),

  adminApproveDesign: (id: string) =>
    request<Design>(`/api/admin/designs/${id}/approve`, { method: "PUT" }),

  adminRejectDesign: (id: string) =>
    request<Design>(`/api/admin/designs/${id}/reject`, { method: "PUT" }),

  adminFeatureDesign: (id: string) =>
    request<Design>(`/api/admin/designs/${id}/feature`, { method: "PUT" }),

  adminDeleteDesign: (id: string) => request<void>(`/api/admin/designs/${id}`, { method: "DELETE" }),

  adminListUsers: () => request<AdminUser[]>("/api/admin/users"),

  adminToggleSuspend: (userId: string) =>
    request<AdminUser>(`/api/admin/users/${userId}/suspend`, { method: "PUT" }),
};
