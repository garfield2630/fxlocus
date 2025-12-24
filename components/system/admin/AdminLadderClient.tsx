"use client";

import React from "react";

type LadderRequestItem = {
  user_id: string;
  requested_at?: string | null;
  system_users?: { full_name?: string; email?: string | null; phone?: string | null } | any;
};

type LatestResponse =
  | { ok: true; url: string | null; captured_at?: string | null }
  | { ok: false; error: string };

export function AdminLadderClient({ locale }: { locale: "zh" | "en" }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<LadderRequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({});

  const [latest, setLatest] = React.useState<{ url: string | null; captured_at?: string | null } | null>(null);

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/ladder/requests", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLatest = React.useCallback(async () => {
    try {
      const res = await fetch("/api/system/ladder/latest", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as LatestResponse | null;
      if (!res.ok || !json?.ok) return;
      setLatest({ url: json.url || null, captured_at: json.captured_at || null });
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    loadRequests();
    loadLatest();
  }, [loadLatest, loadRequests]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/system/admin/ladder/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "upload_failed");
      setFile(null);
      await loadLatest();
    } catch (e: any) {
      setError(e?.message || "upload_failed");
    } finally {
      setUploading(false);
    }
  };

  const review = async (userId: string, action: "approve" | "reject") => {
    setBusyUserId(userId);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/ladder/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          reason: action === "reject" ? rejectReason[userId] || "" : ""
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
      setRejectReason((p) => ({ ...p, [userId]: "" }));
      await loadRequests();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "天梯管理" : "Ladder admin"}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={upload} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
          <div className="text-white/85 font-semibold">{locale === "zh" ? "上传截图" : "Upload snapshot"}</div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 text-sm"
              required
            />
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {uploading ? (locale === "zh" ? "上传中…" : "Uploading…") : locale === "zh" ? "上传" : "Upload"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
            {locale === "zh" ? "待审批申请" : "Pending requests"}
          </div>
          {loading ? (
            <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div>
          ) : null}
          {!loading && !items.length ? (
            <div className="p-6 text-white/60">{locale === "zh" ? "暂无申请" : "No requests"}</div>
          ) : null}
          <div className="divide-y divide-white/10">
            {items.map((it) => {
              const user = Array.isArray(it.system_users) ? it.system_users[0] : it.system_users;
              return (
                <div key={it.user_id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-white/90 font-semibold">{user?.full_name || it.user_id}</div>
                    <div className="text-xs text-white/50">
                      {user?.email || ""} {user?.phone ? `· ${user.phone}` : ""}
                    </div>
                    <div className="ml-auto text-xs text-white/50">
                      {it.requested_at ? new Date(it.requested_at).toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyUserId === it.user_id}
                      onClick={() => review(it.user_id, "approve")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-400/15 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
                    >
                      {locale === "zh" ? "通过" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busyUserId === it.user_id}
                      onClick={() => review(it.user_id, "reject")}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
                    >
                      {locale === "zh" ? "拒绝" : "Reject"}
                    </button>
                    <input
                      value={rejectReason[it.user_id] || ""}
                      onChange={(e) => setRejectReason((p) => ({ ...p, [it.user_id]: e.target.value }))}
                      className="ml-auto min-w-[240px] rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85"
                      placeholder={locale === "zh" ? "拒绝原因（可选）" : "Reject reason (optional)"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {latest?.url ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs text-white/50">
            {locale === "zh" ? "最新截图时间：" : "Latest snapshot: "}
            {latest.captured_at ? new Date(latest.captured_at).toLocaleString() : "-"}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={latest.url} alt="ladder" className="w-full h-auto" />
        </div>
      ) : null}
    </div>
  );
}

