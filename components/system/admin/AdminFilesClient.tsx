"use client";

import React from "react";

type FileRow = {
  id: string;
  category: string;
  name: string;
  description?: string | null;
  storage_bucket: string;
  storage_path: string;
  size_bytes: number;
  mime_type?: string | null;
  created_at: string;
};

function bytesToHuman(bytes: number) {
  if (!bytes || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function AdminFilesClient({ locale }: { locale: "zh" | "en" }) {
  const [items, setItems] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [grantingId, setGrantingId] = React.useState<string | null>(null);

  const [uploadForm, setUploadForm] = React.useState({
    category: locale === "zh" ? "教材PDF" : "PDF",
    name: "",
    description: ""
  });
  const [file, setFile] = React.useState<File | null>(null);

  const [grantUserId, setGrantUserId] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/files/list", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("category", uploadForm.category);
      fd.set("name", uploadForm.name || file.name);
      fd.set("description", uploadForm.description);
      const res = await fetch("/api/system/admin/files/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "upload_failed");
      setFile(null);
      setUploadForm((p) => ({ ...p, name: "", description: "" }));
      await load();
    } catch (e: any) {
      setError(e?.message || "upload_failed");
    } finally {
      setUploading(false);
    }
  };

  const grant = async (fileId: string) => {
    const userId = (grantUserId[fileId] || "").trim();
    if (!userId) return;
    setGrantingId(fileId);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/files/grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileId, userId })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "grant_failed");
      setGrantUserId((p) => ({ ...p, [fileId]: "" }));
    } catch (e: any) {
      setError(e?.message || "grant_failed");
    } finally {
      setGrantingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "文件库" : "File library"}
        </div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "上传课程资料并授权给学员（按用户）。"
            : "Upload files and grant access to students (by user)."}
        </div>
      </div>

      <form onSubmit={upload} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "上传文件" : "Upload"}</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={uploadForm.category}
            onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "分类" : "Category"}
          />
          <input
            value={uploadForm.name}
            onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "显示名称（可选）" : "Display name (optional)"}
          />
          <input
            value={uploadForm.description}
            onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "描述（可选）" : "Description (optional)"}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
        >
          {uploading ? (locale === "zh" ? "上传中…" : "Uploading…") : locale === "zh" ? "上传" : "Upload"}
        </button>
      </form>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "文件列表" : "Files"}
        </div>

        {loading ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div>
        ) : null}

        {!loading && !items.length ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "暂无文件" : "No files"}</div>
        ) : null}

        <div className="divide-y divide-white/10">
          {items.map((f) => (
            <div key={f.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-white/90 font-semibold">{f.name}</div>
                <div className="text-xs text-white/50">{f.category}</div>
                <div className="ml-auto text-xs text-white/50">
                  {bytesToHuman(f.size_bytes)} · {new Date(f.created_at).toLocaleString()}
                </div>
              </div>
              {f.description ? <div className="mt-2 text-sm text-white/70">{f.description}</div> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={grantUserId[f.id] || ""}
                  onChange={(e) => setGrantUserId((p) => ({ ...p, [f.id]: e.target.value }))}
                  className="min-w-[280px] rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85"
                  placeholder={locale === "zh" ? "输入学员 user_id 授权下载" : "Student user_id to grant"}
                />
                <button
                  type="button"
                  disabled={grantingId === f.id}
                  onClick={() => grant(f.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
                >
                  {locale === "zh" ? "授权" : "Grant"}
                </button>
              </div>
              <div className="mt-2 text-xs text-white/40">
                {locale === "zh" ? "storage:" : "storage:"} {f.storage_bucket}/{f.storage_path}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
