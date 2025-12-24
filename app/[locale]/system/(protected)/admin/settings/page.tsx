import { unstable_noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "系统设置" : "Settings"}
        </div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "v1 仅提供占位说明（后续可在此配置来源、自动审批规则等）。"
            : "v1 placeholder for future settings."}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 leading-7">
        <div className="text-white/85 font-semibold mb-2">
          {locale === "zh" ? "环境变量检查" : "Environment variables"}
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>SUPABASE_URL</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
          <li>SYSTEM_JWT_SECRET</li>
          <li>RESEND_API_KEY (optional)</li>
          <li>APP_BASE_URL (optional)</li>
        </ul>
      </div>
    </div>
  );
}

