"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";

import { ButtonLink } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";

function animationPreset(reduceMotion: boolean) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1, y: 0, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1 }
    };
  }
  return {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 }
  };
}

export function Hero() {
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const reduceMotion = useReducedMotion();
const preset = animationPreset(!!reduceMotion);

  const handleScrollToExplore = useCallback(() => {
    const target = document.getElementById("home-content");
    if (target) {
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
      return;
    }

    window.scrollTo({
      top: window.innerHeight,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }, [reduceMotion]);

  return (
    <section className="relative overflow-hidden">
      <motion.div
        initial={preset.initial}
        animate={preset.animate}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col px-6 py-10 lg:py-14"
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="relative">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,160,255,.22)_0%,transparent_60%)] blur-2xl" />
            <Image
              src="/brand/logo-hero.svg"
              alt="FxLocus Trading"
              width={720}
              height={180}
              priority
              className="relative h-[72px] w-auto opacity-95 drop-shadow-[0_18px_80px_rgba(0,160,255,.28)] md:h-[92px] lg:h-[112px]"
              draggable={false}
            />
          </div>

          <p className="text-sm font-semibold tracking-[0.18em] text-rose-400/90 md:text-base">
            {tHome("hero.statement")}
          </p>

          <h1 className="max-w-[28ch] text-balance text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl lg:text-5xl">
            {tHome("hero.title")}
          </h1>

          <div className="pt-2">
            <ButtonLink
              href="/framework"
              locale={locale}
              variant="primary"
              className="rounded-full px-6 py-3"
            >
              {tCommon("cta.enterFramework")}
            </ButtonLink>
          </div>
        </div>

        <button
          type="button"
          onClick={handleScrollToExplore}
          className="group mx-auto mt-10 inline-flex flex-col items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold tracking-[0.22em] text-white/30 transition-colors hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
          aria-label={tHome("hero.scroll.aria")}
        >
          <span>{tHome("hero.scroll.label")}</span>
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white/30 group-hover:text-white/60"
            aria-hidden="true"
            initial={reduceMotion ? false : { y: 0 }}
            animate={reduceMotion ? { y: 0 } : { y: [0, 6, 0] }}
            transition={reduceMotion ? undefined : { duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M12 5v12m0 0l-6-6m6 6l6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </button>
      </motion.div>
    </section>
  );
}
