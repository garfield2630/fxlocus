"use client";

import React from "react";

type RecordRow = {
  id: string;
  type: string | null;
  created_at: string | null;
  email: string | null;
  name: string | null;
  payload: Record<string, unknown> | null;
  content: string | null;
};

function parsePayload(row: RecordRow): Record<string, unknown> {
  if (row.payload && typeof row.payload === "object") return row.payload;
  if (row.content) {
    try {
      const parsed = JSON.parse(row.content) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

function formatTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
  } catch {
    return value;
  }
}

export function AdminRecordsClient({
  locale,
  type,
  title
}: {
  locale: "zh" | "en";
  type: "donate" | "contact" | "enrollment";
  title: string;
}) {
  const [items, setItems] = React.useState<RecordRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<RecordRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/system/admin/records/list?type=${encodeURIComponent(type)}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, [type]);

  React.useEffect(() => {
    load();
  }, [load]);

  const activePayload = React.useMemo(() => (active ? parsePayload(active) : null), [active]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{title}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh" ? "仅超管可见，点击可查看详情。" : "Super admin only. Click to view details."}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold flex items-center gap-2">
          <span>{locale === "zh" ? "列表" : "List"}</span>
          <button
            type="button"
            onClick={load}
            className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
          >
            {locale === "zh" ? "刷新" : "Refresh"}
          </button>
        </div>

        {loading ? <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div> : null}
        {!loading && !items.length ? <div className="p-6 text-white/60">{locale === "zh" ? "暂无数据" : "No items"}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-white/50">
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left">{locale === "zh" ? "姓名" : "Name"}</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "时间" : "Time"}</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "摘要" : "Summary"}</th>
                <th className="px-6 py-3 text-right">{locale === "zh" ? "操作" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((row) => {
                const payload = parsePayload(row);
                const summary =
                  type === "donate"
                    ? `price: ${String(payload.price ?? "-")} · wechat: ${String(payload.wechat ?? "-")}`
                    : type === "contact"
                      ? String(payload.intent ?? payload.message ?? "-")
                      : JSON.stringify(payload).slice(0, 60);

                return (
                  <tr key={row.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white/80">{String(payload.name ?? row.name ?? "-")}</td>
                    <td className="px-6 py-4 text-white/70">{String(payload.email ?? row.email ?? "-")}</td>
                    <td className="px-6 py-4 text-white/60">{formatTime(row.created_at, locale)}</td>
                    <td className="px-6 py-4 text-white/60 max-w-[420px] truncate">{summary}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActive(row)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                      >
                        {locale === "zh" ? "查看" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="w-full max-w-[900px] rounded-3xl border border-white/10 bg-[#050a14] p-6">
            <div className="flex items-center gap-2">
              <div className="text-white/90 font-semibold">{locale === "zh" ? "详情" : "Details"}</div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
              >
                {locale === "zh" ? "关闭" : "Close"}
              </button>
            </div>
            <div className="mt-3 text-xs text-white/50">
              id: {active.id} · {formatTime(active.created_at, locale)}
            </div>
            <pre className="mt-4 max-h-[65vh] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80">
              {JSON.stringify(activePayload, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

