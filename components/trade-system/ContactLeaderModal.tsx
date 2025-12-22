"use client";

import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ContactLeaderModal({ open, onClose }: Props) {
  const t = useTranslations("system");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label={t("auth.registerHintAction")}
      />
      <div className="relative w-[420px] max-w-[90vw] rounded-2xl border border-white/10 bg-[#0b1220] p-6">
        <div className="text-lg font-semibold text-slate-50">
          {t("auth.registerHintTitle")}
        </div>
        <div className="mt-2 text-sm text-slate-200/70">
          {t("auth.registerHintBody")}
        </div>
        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-white/10 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15"
          onClick={onClose}
        >
          {t("auth.registerHintAction")}
        </button>
      </div>
    </div>
  );
}
