"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { ContactLeaderModal } from "@/components/trade-system/ContactLeaderModal";
import { MockLoginForm } from "@/components/trade-system/MockLoginForm";

type Props = {
  next?: string;
};

export function TradeSystemLogin({ next }: Props) {
  const t = useTranslations("system");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-mark.svg"
            width={40}
            height={40}
            alt="FxLocus"
            className="h-10 w-10"
          />
          <div>
            <div className="text-xs font-semibold tracking-[0.18em] text-slate-200/60">
              FxLocus
            </div>
            <div className="text-2xl font-semibold text-slate-50">{t("title")}</div>
          </div>
        </div>

        <div className="mt-6">
          <MockLoginForm
            next={next}
            variant="plain"
            showDemo={false}
            onRegister={() => setModalOpen(true)}
          />
        </div>
      </div>

      <ContactLeaderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
