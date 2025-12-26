"use client";

import React from "react";

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationsClient({ locale }: { locale: "zh" | "en" }) {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    const res = await fetch("/api/system/notifications/list", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    setItems(Array.isArray(json?.items) ? json.items : []);
    if (withSpinner) setLoading(false);
  }, []);

  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      if (!alive) return;
      await load();
    };

    load(true);
    const id = window.setInterval(refresh, 15_000);
    const onFocus = () => {
      if (!document.hidden) refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  const markRead = async (id: string) => {
    await fetch(`/api/system/notifications/${id}/read`, { method: "POST" });
    load();
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "通知" : "Notifications"}</div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "加载中..." : "Loading..."}
        </div>
      ) : null}

      {!loading && !items.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "暂无消息。" : "No messages."}
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2">
              <div className="text-white/90 font-semibold">{n.title}</div>
              <div className="ml-auto text-xs text-white/50">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
            <div className="mt-2 text-white/70 leading-7 whitespace-pre-wrap">{n.content}</div>
            <div className="mt-4">
              {n.read_at ? (
                <span className="text-xs text-white/50">{locale === "zh" ? "已读" : "Read"}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15"
                >
                  {locale === "zh" ? "标记已读" : "Mark as read"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
