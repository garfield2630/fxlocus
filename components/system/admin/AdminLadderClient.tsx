"use client";

import React from "react";

import LadderImage from "@/components/system/LadderImage";
import { LADDER_IMAGE_URL, LADDER_REFRESH_MS } from "@/lib/system/ladderConfig";

type LadderRequestItem = {
  user_id: string;
  requested_at?: string | null;
  user?: { id: string; full_name?: string; email?: string | null; phone?: string | null } | null;
};

export function AdminLadderClient({ locale }: { locale: "zh" | "en" }) {
  const [error, setError] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<LadderRequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [filterStudent, setFilterStudent] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({});
  const [bulkRejectReason, setBulkRejectReason] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = filterStudent.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => {
      const hay = `${it.user?.full_name || ""} ${it.user?.email || ""} ${it.user?.phone || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [filterStudent, items]);

  const selectedItems = React.useMemo(() => {
    const byId = new Map(items.map((it) => [it.user_id, it]));
    return Array.from(selected)
      .map((id) => byId.get(id))
      .filter(Boolean) as LadderRequestItem[];
  }, [items, selected]);

  const allFilteredSelected = React.useMemo(() => {
    if (!filtered.length) return false;
    return filtered.every((it) => selected.has(it.user_id));
  }, [filtered, selected]);

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/ladder/requests", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
      const nextItems = Array.isArray(json.items) ? (json.items as LadderRequestItem[]) : [];
      setItems(nextItems);
      setSelected((prev) => {
        const keep = new Set(nextItems.map((it) => it.user_id));
        const next = new Set<string>();
        for (const k of prev) if (keep.has(k)) next.add(k);
        return next;
      });
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const reviewBulk = async (payload: { userIds: string[]; action: "approve" | "reject"; reason?: string }) => {
    const res = await fetch("/api/system/admin/ladder/review-bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: payload.userIds.map((id) => ({ userId: id })),
        action: payload.action,
        reason: payload.reason
      })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
  };

  const reviewOne = async (userId: string, action: "approve" | "reject") => {
    setBusyKey(userId);
    setError(null);
    try {
      await reviewBulk({
        userIds: [userId],
        action,
        reason: action === "reject" ? rejectReason[userId] || undefined : undefined
      });
      setRejectReason((p) => ({ ...p, [userId]: "" }));
      await loadRequests();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setBusyKey(null);
    }
  };

  const reviewSelected = async (action: "approve" | "reject") => {
    if (!selectedItems.length) return;
    setBusyKey("BULK");
    setError(null);
    try {
      await reviewBulk({
        userIds: selectedItems.map((it) => it.user_id),
        action,
        reason: action === "reject" ? bulkRejectReason || undefined : undefined
      });
      setSelected(new Set());
      setBulkRejectReason("");
      await loadRequests();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setBusyKey(null);
    }
  };

  const approveAll = async () => {
    if (!items.length) return;
    setBusyKey("ALL");
    setError(null);
    try {
      await reviewBulk({ userIds: items.map((it) => it.user_id), action: "approve" });
      setSelected(new Set());
      await loadRequests();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setBusyKey(null);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const it of filtered) next.delete(it.user_id);
      } else {
        for (const it of filtered) next.add(it.user_id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex items-center gap-3">
        <div>
          <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "天梯管理" : "Ladder admin"}</div>
          <div className="mt-2 text-white/60 text-sm">
            {locale === "zh"
              ? "审批天梯申请（支持多选批量）。"
              : "Review ladder requests (bulk supported)."}
          </div>
        </div>
        <button
          type="button"
          disabled={busyKey === "ALL" || !items.length}
          onClick={approveAll}
          className="ml-auto px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
        >
          {locale === "zh" ? "一键通过全部" : "Approve all"}
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-3 text-white/85 font-semibold">
          {locale === "zh" ? "天梯预览（自动刷新）" : "Ladder preview (auto refresh)"}
        </div>
        <LadderImage baseUrl={LADDER_IMAGE_URL} intervalMs={LADDER_REFRESH_MS} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "待审批申请" : "Pending requests"}
        </div>

        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center gap-2">
          <input
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
            placeholder={locale === "zh" ? "搜索学员：姓名/邮箱/手机" : "Search student: name/email/phone"}
          />
          <button
            type="button"
            disabled={!selectedItems.length || busyKey === "BULK"}
            onClick={() => reviewSelected("approve")}
            className="px-3 py-2 rounded-xl bg-emerald-400/15 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {locale === "zh" ? `通过已选(${selectedItems.length})` : `Approve (${selectedItems.length})`}
          </button>
          <button
            type="button"
            disabled={!selectedItems.length || busyKey === "BULK"}
            onClick={() => reviewSelected("reject")}
            className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
          >
            {locale === "zh" ? `拒绝已选(${selectedItems.length})` : `Reject (${selectedItems.length})`}
          </button>
          <input
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            className="min-w-[220px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
            placeholder={locale === "zh" ? "批量拒绝原因（可选）" : "Bulk reject reason (optional)"}
          />
        </div>

        {loading ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "加载中..." : "Loading..."}</div>
        ) : null}
        {!loading && !filtered.length ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "暂无申请" : "No requests"}</div>
        ) : null}

        <div className="divide-y divide-white/10">
          {filtered.map((it) => {
            const contact = [it.user?.email, it.user?.phone].filter(Boolean).join(" · ");
            return (
              <div key={it.user_id} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(it.user_id)}
                    onChange={() => toggleSelected(it.user_id)}
                    className="h-4 w-4 accent-sky-400"
                    aria-label="select"
                  />
                  <div className="text-white/90 font-semibold">{it.user?.full_name || it.user_id}</div>
                  <div className="text-xs text-white/50">{contact ? `· ${contact}` : ""}</div>
                  <div className="ml-auto text-xs text-white/50">
                    {it.requested_at ? new Date(it.requested_at).toLocaleString() : ""}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyKey === it.user_id}
                    onClick={() => reviewOne(it.user_id, "approve")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-400/15 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
                  >
                    {locale === "zh" ? "通过" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === it.user_id}
                    onClick={() => reviewOne(it.user_id, "reject")}
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

        <div className="px-6 py-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/50">
          <button
            type="button"
            onClick={toggleSelectAllFiltered}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
          >
            {allFilteredSelected
              ? locale === "zh"
                ? "取消全选"
                : "Clear all"
              : locale === "zh"
                ? "全选当前"
                : "Select all"}
          </button>
          <span className="ml-auto">
            {locale === "zh" ? "当前显示" : "Showing"} {filtered.length} · {" "}
            {locale === "zh" ? "已选" : "Selected"} {selectedItems.length}
          </span>
        </div>
      </div>
    </div>
  );
}
