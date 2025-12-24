"use client";

import React from "react";

type Snap = {
  id: string;
  url: string;
  captured_at: string;
};

export function LadderViewer({ locale }: { locale: "zh" | "en" }) {
  const [latest, setLatest] = React.useState<Snap | null>(null);
  const [history, setHistory] = React.useState<Snap[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/system/ladder/latest", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/system/ladder/history?limit=20", { cache: "no-store" }).then((r) => r.json())
      ]);
      setLatest(a?.item || null);
      setHistory(Array.isArray(b?.items) ? b.items : []);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = window.setInterval(load, 3 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex items-center gap-3">
        <div>
          <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "天梯" : "Ladder"}</div>
          <div className="mt-1 text-white/60 text-sm">
            {locale === "zh" ? "每 3 分钟自动刷新。" : "Auto-refresh every 3 minutes."}
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="ml-auto px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15"
        >
          {locale === "zh" ? "刷新" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "加载中…" : "Loading…"}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : null}

      {latest?.url ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs text-white/50">
            {locale === "zh" ? "最后更新时间：" : "Updated: "}
            {latest.captured_at ? new Date(latest.captured_at).toLocaleString() : "-"}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={latest.url} alt="ladder" className="w-full h-auto" />
        </div>
      ) : (
        !loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
            {locale === "zh" ? "未开通或暂无截图。" : "Not enabled or no snapshots yet."}
          </div>
        )
      )}

      {history.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-white/85 font-semibold">{locale === "zh" ? "历史" : "History"}</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {history.map((h) => (
              <a
                key={h.id}
                href={h.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="text-xs text-white/60">{new Date(h.captured_at).toLocaleString()}</div>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

