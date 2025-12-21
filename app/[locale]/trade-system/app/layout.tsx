import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SystemShell } from "@/components/trade-system/SystemShell";
import type { Locale } from "@/i18n/routing";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";

type Props = {
  children: ReactNode;
  params: { locale: Locale };
};

export default async function TradeSystemAppLayout({ children, params }: Props) {
  const secret = process.env.FXLOCUS_AUTH_SECRET || "fxlocus-dev-secret";
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySession(cookie, secret);

  if (!session) {
    redirect(`/${params.locale}/trade-system/login?next=/${params.locale}/trade-system/app/dashboard`);
  }

  return <SystemShell role={session.role}>{children}</SystemShell>;
}

