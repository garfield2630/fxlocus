"use client";

import React from "react";

import { AdminFilesClient } from "@/components/system/admin/AdminFilesClient";

type MeResponse =
  | { ok: true; user: { role: "admin" | "student" } }
  | { ok: false; error: string };

type FileItem = {
  id: string;
  category: string;
  name: string;
  description?: string | null;
  size_bytes: number;
  created_at: string;
};

export function FilesClient({ locale }: { locale: "zh" | "en" }) {
  const [role, setRole] = React.useState<"admin" | "student" | null>(null);
  const [items, setItems] = React.useState<FileItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch("/api/system/me", { cache: "no-store" });
        const meJson = (await meRes.json().catch(() => null)) as MeResponse | null;
        if (!alive) return;
        if (!meRes.ok || !meJson?.ok) throw new Error((meJson as any)?.error || "load_failed");

        const nextRole = meJson.user.role;
        setRole(nextRole);

        if (nextRole === "admin") {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/system/files/list", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
        setItems(Array.isArray(json.files) ? json.files : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "load_failed");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const download = async (id: string) => {
    const res = await fetch("/api/system/files/download", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileId: id })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !json?.url) return;
    window.open(json.url, "_blank", "noreferrer");
  };

  if (role === "admin") return <AdminFilesClient locale={locale} />;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "加载中…" : "Loading…"}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {locale === "zh" ? "加载失败：" : "Failed: "} {error}
        </div>
      ) : null}

      {!loading && !items.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "暂无授权文件" : "No authorized files."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((f) => (
          <div key={f.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs text-white/50">{f.category}</div>
            <div className="mt-2 text-white/90 font-semibold">{f.name}</div>
            {f.description ? <div className="mt-2 text-sm text-white/65 leading-6">{f.description}</div> : null}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15"
                onClick={() => download(f.id)}
              >
                {locale === "zh" ? "下载" : "Download"}
              </button>
              <div className="ml-auto text-xs text-white/45">
                {f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

