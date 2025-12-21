import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export default function TradeSystemAppIndex({ params }: Props) {
  redirect(`/${params.locale}/trade-system/app/dashboard`);
}

