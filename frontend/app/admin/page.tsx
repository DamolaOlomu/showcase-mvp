"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Design, AdminUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Tab = "pending" | "approved" | "rejected" | "users";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [designs, setDesigns] = useState<Design[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) router.push("/");
  }, [loading, user, router]);

  const loadDesigns = useCallback(async (status: "pending" | "approved" | "rejected") => {
    setFetching(true);
    try {
      const data = await api.adminListDesigns(status);
      setDesigns(data);
    } finally {
      setFetching(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setFetching(true);
    try {
      const data = await api.adminListUsers();
      setUsers(data);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.is_admin) return;
    setActionError(null);
    if (tab === "users") loadUsers();
    else loadDesigns(tab);
  }, [tab, user, loadDesigns, loadUsers]);

  async function handleAction(action: () => Promise<any>) {
    setActionError(null);
    try {
      await action();
      if (tab === "users") loadUsers();
      else loadDesigns(tab as "pending" | "approved" | "rejected");
    } catch (err: any) {
      setActionError(err.message || "Action failed");
    }
  }

  if (loading || !user?.is_admin) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Admin</h1>

      <div className="flex gap-2 mb-8 text-sm">
        {(["pending", "approved", "rejected", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full border capitalize transition ${
              tab === t ? "bg-ink text-white border-ink" : "border-neutral-300 hover:border-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}

      {fetching ? (
        <p className="text-neutral-500 text-sm">Loading…</p>
      ) : tab === "users" ? (
        <UsersTable users={users} onToggleSuspend={(id) => handleAction(() => api.adminToggleSuspend(id))} />
      ) : (
        <DesignsTable
          designs={designs}
          tab={tab}
          onApprove={(id) => handleAction(() => api.adminApproveDesign(id))}
          onReject={(id) => handleAction(() => api.adminRejectDesign(id))}
          onFeature={(id) => handleAction(() => api.adminFeatureDesign(id))}
          onDelete={(id) => handleAction(() => api.adminDeleteDesign(id))}
        />
      )}
    </div>
  );
}

function DesignsTable({
  designs,
  tab,
  onApprove,
  onReject,
  onFeature,
  onDelete,
}: {
  designs: Design[];
  tab: Tab;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFeature: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (designs.length === 0) {
    return <p className="text-neutral-500 text-sm">Nothing here.</p>;
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {designs.map((d) => {
        const thumb = d.images.find((i) => i.type === "desktop")?.thumbnail_url || d.images[0]?.original_url;
        return (
          <div
            key={d.id}
            className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 last:border-0 text-sm"
          >
            <div className="w-16 h-12 bg-neutral-100 rounded overflow-hidden shrink-0">
              {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt={d.title} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.title}</p>
              <p className="text-neutral-500 text-xs">
                @{d.designer.username} · {d.category || "Uncategorized"}
                {d.featured && " · ★ Featured"}
              </p>
            </div>

            {d.moderation_flag === "flagged" && (
              <span
                title={d.moderation_reason || ""}
                className="text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full shrink-0"
              >
                ⚠️ Flagged
              </span>
            )}
            {d.moderation_flag === "safe" && (
              <span className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full shrink-0">
                ✓ AI-checked
              </span>
            )}

            <div className="flex items-center gap-2 shrink-0">
              {tab !== "approved" && (
                <button
                  onClick={() => onApprove(d.id)}
                  className="px-3 py-1.5 bg-ink text-white rounded-full text-xs hover:opacity-80"
                >
                  Approve
                </button>
              )}
              {tab !== "rejected" && (
                <button
                  onClick={() => onReject(d.id)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-full text-xs hover:border-ink"
                >
                  Reject
                </button>
              )}
              {tab === "approved" && (
                <button
                  onClick={() => onFeature(d.id)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-full text-xs hover:border-ink"
                >
                  {d.featured ? "Unfeature" : "Feature"}
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`Delete "${d.title}" permanently?`)) onDelete(d.id);
                }}
                className="px-3 py-1.5 text-red-600 rounded-full text-xs hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsersTable({
  users,
  onToggleSuspend,
}: {
  users: AdminUser[];
  onToggleSuspend: (id: string) => void;
}) {
  if (users.length === 0) {
    return <p className="text-neutral-500 text-sm">No users yet.</p>;
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 last:border-0 text-sm"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              @{u.username} {u.is_admin && <span className="text-xs text-neutral-400">(admin)</span>}
            </p>
            <p className="text-neutral-500 text-xs">{u.email}</p>
          </div>
          <span className="text-xs text-neutral-500 shrink-0">{u.follower_count} followers</span>
          {u.is_suspended ? (
            <span className="text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full shrink-0">
              Suspended
            </span>
          ) : null}
          {!u.is_admin && (
            <button
              onClick={() => onToggleSuspend(u.id)}
              className="px-3 py-1.5 border border-neutral-300 rounded-full text-xs hover:border-ink shrink-0"
            >
              {u.is_suspended ? "Unsuspend" : "Suspend"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
