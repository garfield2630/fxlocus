import { unstable_noStore } from "next/cache";

import { requireSystemUser } from "@/lib/system/auth";
import { FirstLoginClient } from "@/components/system/FirstLoginClient";

export const dynamic = "force-dynamic";

export default async function FirstLoginPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const user = await requireSystemUser(locale, { allowMustChangePasswordPage: true });
  return <FirstLoginClient locale={locale} userRole={user.role} />;
}

