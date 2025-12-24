"use client";

import React from "react";

import { AdminLadderClient } from "@/components/system/admin/AdminLadderClient";

type MeResponse =
  | { ok: true; user: { role: "admin" | "student" } }
  | { ok: false; error: string };

type LatestResponse =
  | { ok: true; status: string; url: string | null; captured_at?: string | null }
  | { ok: false; error: string };

export function LadderViewer({ locale }: { locale: "zh" | "en" }) {
  const [role, setRole] = React.useState<"admin" | "student" | null>(null);
  const [status, setStatus] = React.useState<string>("none");
  const [url, setUrl] = React.useState<string | null>(null);
  const [capturedAt, setCapturedAt] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [requesting, setRequesting] = React.useState(false);

  const loadLatest = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/system/ladder/latest", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as LatestResponse | null;
      if (!res.ok || !json?.ok) throw new Error((json as any)?.error || "load_failed");
      setStatus(String(json.status || "none"));
      setUrl(json.url || null);
      setCapturedAt(json.captured_at ? String(json.captured_at) : null);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch("/api/system/me", { cache: "no-store" });
        const meJson = (await meRes.json().catch(() => null)) as MeResponse | null;
        if (!alive) return;
        if (!meRes.ok || !meJson?.ok) throw new Error((meJson as any)?.error || "load_failed");
        setRole(meJson.user.role);
        if (meJson.user.role === "student") await loadLatest();
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "load_failed");
      } finally {
        if (alive) setLoading(false);
      }
    };
    init();
    return () => {
      alive = false;
    };
  }, [loadLatest]);

  React.useEffect(() => {
    if (role !== "student") return;
    const id = window.setInterval(loadLatest, 3 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [role, loadLatest]);

  const request = async () => {
    setRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/system/ladder/request", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "request_failed");
      await loadLatest();
    } catch (e: any) {
      setError(e?.message || "request_failed");
    } finally {
      setRequesting(false);
    }
  };

  if (role === "admin") return <AdminLadderClient locale={locale} />;

  const showRequestButton = role === "student" && status !== "requested" && status !== "approved";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex items-center gap-3">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "天梯" : "Ladder"}</div>
        <button
          type="button"
          onClick={loadLatest}
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
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      {!loading && status !== "approved" ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-white/70 text-sm">
            {status === "requested"
              ? locale === "zh"
                ? "已申请，等待管理员审批。"
                : "Requested. Waiting for approval."
              : status === "rejected"
                ? locale === "zh"
                  ? "申请未通过，可重新申请。"
                  : "Rejected. You can request again."
                : locale === "zh"
                  ? "未开通天梯。"
                  : "Not enabled."}
          </div>
          {showRequestButton ? (
            <button
              type="button"
              disabled={requesting}
              onClick={request}
              className="mt-4 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {locale === "zh" ? "申请天梯" : "Request ladder"}
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && status === "approved" && url ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs text-white/50">
            {locale === "zh" ? "更新时间：" : "Updated: "}
            {capturedAt ? new Date(capturedAt).toLocaleString() : "-"}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="ladder" className="w-full h-auto" />
        </div>
      ) : null}

      {!loading && status === "approved" && !url ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "暂无截图" : "No snapshot yet."}
        </div>
      ) : null}
    </div>
  );
}

