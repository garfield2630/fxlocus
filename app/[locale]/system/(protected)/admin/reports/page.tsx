import { unstable_noStore } from "next/cache";

import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function AdminReportsPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const admin = supabaseAdmin();

  const [
    { count: usersCount },
    { count: frozenCount },
    { count: requestedCount },
    { count: approvedCount },
    { count: completedCount },
    { data: downloadLogs },
    donateRes,
    contactRes
  ] = await Promise.all([
    admin.from("system_users").select("*", { count: "exact", head: true }),
    admin.from("system_users").select("*", { count: "exact", head: true }).eq("status", "frozen"),
    admin.from("course_access").select("*", { count: "exact", head: true }).eq("status", "requested"),
    admin.from("course_access").select("*", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("course_access").select("*", { count: "exact", head: true }).eq("status", "completed"),
    admin.from("file_download_logs").select("file_id").order("downloaded_at", { ascending: false }).limit(500),
    admin
      .from("records")
      .select("id,type,created_at,email,name,payload,content")
      .eq("type", "donate")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("records")
      .select("id,type,created_at,email,name,payload,content")
      .eq("type", "contact")
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const counts = new Map<string, number>();
  (downloadLogs || []).forEach((row: any) => {
    counts.set(row.file_id, (counts.get(row.file_id) || 0) + 1);
  });
  const topFileIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
  const { data: topFiles } = topFileIds.length
    ? await admin.from("files").select("id,name").in("id", topFileIds)
    : { data: [] as any[] };

  const top = topFileIds.map((id) => ({
    id,
    name: (topFiles || []).find((f: any) => f.id === id)?.name || id,
    downloads: counts.get(id) || 0
  }));

  const donateRows = Array.isArray(donateRes?.data) ? (donateRes.data as RecordRow[]) : [];
  const contactRows = Array.isArray(contactRes?.data) ? (contactRes.data as RecordRow[]) : [];

  const donateItems = donateRows.map((row) => {
    const payload = parsePayload(row);
    const phone = (payload.phone as any)?.e164 || (payload.phone as any)?.nationalNumber || "-";
    return {
      id: row.id,
      name: (payload.name as string) || row.name || "-",
      email: (payload.email as string) || row.email || "-",
      price: typeof payload.price === "number" ? payload.price : "-",
      priceDate: typeof payload.priceDate === "string" ? payload.priceDate : "-",
      phone,
      createdAt: formatTime((payload.receivedAt as string) || row.created_at, locale)
    };
  });

  const contactItems = contactRows.map((row) => {
    const payload = parsePayload(row);
    const phone = (payload.phone as any)?.e164 || (payload.phone as any)?.nationalNumber || "-";
    return {
      id: row.id,
      name: (payload.name as string) || row.name || "-",
      email: (payload.email as string) || row.email || "-",
      intent: (payload.intent as string) || "-",
      wechat: (payload.wechat as string) || "-",
      phone,
      message: (payload.message as string) || "-",
      createdAt: formatTime((payload.receivedAt as string) || row.created_at, locale)
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "统计报表" : "Reports"}
        </div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "基础指标概览（后续可扩展图表）。"
            : "Basic metrics overview (extend with charts later)."}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "用户总数" : "Users"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{usersCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "冻结账号" : "Frozen"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{frozenCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "待审批申请" : "Requested"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{requestedCount || 0}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "已通过" : "Approved"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{approvedCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "已完成" : "Completed"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{completedCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">
            {locale === "zh" ? "文件下载（近 500）" : "Downloads (last 500)"}
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">{downloadLogs?.length || 0}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "文件下载 Top10" : "Top files"}</div>
        <div className="mt-4 divide-y divide-white/10">
          {top.map((row) => (
            <div key={row.id} className="py-3 flex items-center gap-3">
              <div className="text-white/90 font-semibold">{row.name}</div>
              <div className="ml-auto text-white/60 text-sm">{row.downloads}</div>
            </div>
          ))}
          {!top.length ? <div className="py-3 text-white/60">-</div> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-white/85 font-semibold">
            {locale === "zh" ? "捐赠记录（最近 50）" : "Donate submissions (latest 50)"}
          </div>
          <div className="mt-4 space-y-3">
            {donateItems.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                  <span className="font-semibold text-white">{row.name}</span>
                  <span className="text-white/50">{row.email}</span>
                  <span className="ml-auto text-xs text-white/50">{row.createdAt}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span>{locale === "zh" ? "价格" : "Price"}: {row.price}</span>
                  <span>{locale === "zh" ? "日期" : "Date"}: {row.priceDate}</span>
                  <span>{locale === "zh" ? "电话" : "Phone"}: {row.phone}</span>
                </div>
              </div>
            ))}
            {!donateItems.length ? <div className="text-sm text-white/50">-</div> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-white/85 font-semibold">
            {locale === "zh" ? "联系表单记录（最近 50）" : "Contact submissions (latest 50)"}
          </div>
          <div className="mt-4 space-y-3">
            {contactItems.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                  <span className="font-semibold text-white">{row.name}</span>
                  <span className="text-white/50">{row.email}</span>
                  <span className="ml-auto text-xs text-white/50">{row.createdAt}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span>{locale === "zh" ? "意向" : "Intent"}: {row.intent}</span>
                  <span>{locale === "zh" ? "微信" : "WeChat"}: {row.wechat}</span>
                  <span>{locale === "zh" ? "电话" : "Phone"}: {row.phone}</span>
                </div>
                <div className="mt-2 text-xs text-white/60 whitespace-pre-wrap">
                  {row.message}
                </div>
              </div>
            ))}
            {!contactItems.length ? <div className="text-sm text-white/50">-</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
