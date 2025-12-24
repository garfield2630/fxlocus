"use client";

import React from "react";

import { LadderViewer } from "@/components/system/LadderViewer";

export function AdminLadderClient({ locale }: { locale: "zh" | "en" }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

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
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message || "upload_failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "天梯管理" : "Ladder admin"}
        </div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "上传最新截图并自动更新学员端展示。"
            : "Upload the latest snapshot; student view updates automatically."}
        </div>
      </div>

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
        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </form>

      <div key={refreshKey}>
        <LadderViewer locale={locale} />
      </div>
    </div>
  );
}

