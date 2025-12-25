"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";

import { PhoneField, type PhoneFieldValue } from "@/components/forms/PhoneField";
import { Button } from "@/components/ui/Button";

const RichTextEditor = dynamic(
  () => import("./RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false }
);

type Locale = "zh" | "en";

type DonateApplication = {
  id: string;
  createdAt: string;
  locale: Locale;
  name: string;
  email: string;
  telegramWhatsApp?: string;
  wechat?: string;
  phone?: PhoneFieldValue;
  countryRegion?: string; // legacy
  tradingYears: string;
  instruments: string[];
  bottlenecks: string[];
  weeklyFrequency: string;
  whyJoin: string;
  goal90d: string;
  challenge: "yes" | "no";
  thoughtsHtml: string;
};

async function fetchApplications(email: string): Promise<DonateApplication[]> {
  if (!email.trim()) return [];
  const res = await fetch(`/api/donate?email=${encodeURIComponent(email.trim())}`, {
    cache: "no-store"
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.items) ? (json.items as DonateApplication[]) : [];
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function startOfLocalDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatHms(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function DonateClient() {
  const locale = useLocale() as Locale;
  const t = useTranslations("donate");
  const tCommon = useTranslations("common");

  const [now, setNow] = useState(() => new Date());
  const [priceInfo, setPriceInfo] = useState<null | { price: number; nextUpdateAt: string }>(null);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState<null | { id: string; createdAt: string }>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [walletCopied, setWalletCopied] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    telegramWhatsApp: "",
    wechat: "",
    phone: null as PhoneFieldValue | null,
    tradingYears: "",
    instruments: [] as string[],
    bottlenecks: [] as string[],
    weeklyFrequency: "",
    whyJoin: "",
    goal90d: "",
    challenge: "no" as "yes" | "no",
    thoughtsHtml: ""
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const loadPrice = useCallback(async () => {
    try {
      const res = await fetch("/api/donate/price", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "price_failed");
      setPriceInfo({ price: Number(json.price || 0), nextUpdateAt: String(json.nextUpdateAt || "") });
    } catch {
      // ignore and keep fallback price
    }
  }, []);

  useEffect(() => {
    loadPrice();
  }, [loadPrice]);

  useEffect(() => {
    if (!priceInfo?.nextUpdateAt) return;
    const nextTs = new Date(priceInfo.nextUpdateAt).getTime();
    const delay = Math.max(1000, nextTs - Date.now() + 1000);
    const id = window.setTimeout(() => {
      void loadPrice();
    }, delay);
    return () => window.clearTimeout(id);
  }, [priceInfo?.nextUpdateAt, loadPrice]);

  const { price, countdown } = useMemo(() => {
    const fallbackPrice = 1680;
    const nextUpdate = priceInfo?.nextUpdateAt ? new Date(priceInfo.nextUpdateAt) : null;
    const nextTick = nextUpdate ? nextUpdate.getTime() : startOfLocalDay(now).getTime() + 86_400_000;
    const diffSeconds = Math.max(0, Math.floor((nextTick - now.getTime()) / 1000));
    return { price: priceInfo?.price || fallbackPrice, countdown: formatHms(diffSeconds) };
  }, [now, priceInfo]);

  const instrumentsOptions = useMemo(
    () => [
      { value: "fx", label: t("form.options.instruments.fx") },
      { value: "gold", label: t("form.options.instruments.gold") },
      { value: "crypto", label: t("form.options.instruments.crypto") },
      { value: "index", label: t("form.options.instruments.index") },
      { value: "stocks", label: t("form.options.instruments.stocks") },
      { value: "other", label: t("form.options.instruments.other") }
    ],
    [t]
  );

  const bottleneckOptions = useMemo(
    () => [
      { value: "impulse", label: t("form.options.bottlenecks.impulse") },
      { value: "fomo", label: t("form.options.bottlenecks.fomo") },
      { value: "overtrading", label: t("form.options.bottlenecks.overtrading") },
      { value: "no_discipline", label: t("form.options.bottlenecks.noDiscipline") },
      { value: "structure", label: t("form.options.bottlenecks.structure") },
      { value: "review", label: t("form.options.bottlenecks.review") },
      { value: "other", label: t("form.options.bottlenecks.other") }
    ],
    [t]
  );

  const toggleMulti = (key: "instruments" | "bottlenecks", value: string) => {
    setForm((prev) => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    const required = (field: string, value: string | string[]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) nextErrors[field] = t("validation.required");
      } else if (!value.trim()) {
        nextErrors[field] = t("validation.required");
      }
    };

    required("name", form.name);
    required("email", form.email);
    required("tradingYears", form.tradingYears);
    required("weeklyFrequency", form.weeklyFrequency);
    required("whyJoin", form.whyJoin);
    required("goal90d", form.goal90d);
    required("thoughtsHtml", form.thoughtsHtml.replace(/<[^>]*>/g, "").trim());

    if (!form.phone?.e164 || form.phone.e164.replace(/\D/g, "").length < 8) {
      nextErrors.phone = t("validation.required");
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (form.email.trim() && !emailOk) nextErrors.email = t("validation.invalidEmail");

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setGlobalError(null);
    setSubmitted(null);

    if (website.trim()) {
      setGlobalError(t("validation.botDetected"));
      return;
    }

    if (!validate()) return;

    const payload = {
      locale,
      name: form.name.trim(),
      email: form.email.trim(),
      telegramWhatsApp: form.telegramWhatsApp.trim() || undefined,
      wechat: form.wechat.trim() || undefined,
      phone: form.phone ?? undefined,
      tradingYears: form.tradingYears,
      instruments: form.instruments,
      bottlenecks: form.bottlenecks,
      weeklyFrequency: form.weeklyFrequency.trim(),
      whyJoin: form.whyJoin.trim(),
      goal90d: form.goal90d.trim(),
      challenge: form.challenge,
      thoughtsHtml: form.thoughtsHtml
    };
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const code = json?.code;
        if (code === "rate_limited") {
          setGlobalError(t("validation.rateLimited"));
        } else if (code === "invalid_email") {
          setGlobalError(t("validation.invalidEmail"));
        } else {
          setGlobalError("Submission failed. Please try again.");
        }
        return;
      }

      setLastEmail(payload.email);
      setSubmitted({
        id: String(json.id || ""),
        createdAt: String(json.createdAt || new Date().toISOString())
      });
    } catch {
      setGlobalError("Submission failed. Please try again.");
    }
  };

  const exportAll = async () => {
    const email = (lastEmail || form.email).trim();
    if (!email) {
      setGlobalError("Please enter an email before export.");
      return;
    }
    const data = await fetchApplications(email);
    downloadJson(`fxlocus-donate-applications-${new Date().toISOString().slice(0, 10)}.json`, data);
  };

  const rulesItems = t.raw("rules.items") as unknown as string[];
  const walletAddress = t("rules.walletValue");

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setWalletCopied(true);
      window.setTimeout(() => setWalletCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-10 md:space-y-12">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-7 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)]" />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
              {t("pricing.amountLabel")}
            </div>
            <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-50 tabular-nums">
              ${price}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
              {t("pricing.countdownLabel")}
            </div>
            <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-50 tabular-nums">
              {countdown}
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 md:items-end md:text-right">
            <div className="text-sm text-slate-200/70">{t("pricing.dailyIncrease")}</div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <Button variant="primary" className="rounded-full px-6 py-3" onClick={() => setOpen(true)}>
                {t("cta.openForm")}
              </Button>
              <Button variant="secondary" className="rounded-full px-6 py-3" onClick={exportAll}>
                {t("cta.export")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-50">{t("rules.title")}</h2>
        <div className="grid gap-3">
          {rulesItems.map((item, index) => (
            <div key={item} className="fx-card p-6">
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-mono text-xs font-semibold text-slate-50 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-sm leading-7 text-slate-200/75">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="fx-card p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-50">{t("rules.walletLabel")}</h2>
          <Button variant="secondary" size="sm" className="rounded-full" onClick={copyWallet}>
            {walletCopied ? tCommon("ui.copied") : tCommon("cta.copy")}
          </Button>
        </div>
        <pre className="mt-5 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-50">
          <code className="break-all font-mono">{walletAddress}</code>
        </pre>
      </section>

      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 px-6 py-5 text-sm leading-7 text-rose-100/90">
        {t("footerRisk")}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("form.title")}
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="fx-surface max-h-[90vh] w-full max-w-3xl overflow-auto p-6 md:p-8"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-50">{t("form.title")}</h2>
                <p className="mt-2 text-sm text-slate-200/70">{t("form.subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-white/10"
              >
                {t("form.actions.close")}
              </button>
            </div>

            {submitted ? (
              <div className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-slate-50">{t("form.success.title")}</div>
                <div className="text-sm text-slate-200/75">
                  {t("form.success.body", { id: submitted.id })}
                </div>
                <div className="text-xs text-slate-200/60">
                  {t("form.success.time", { time: new Date(submitted.createdAt).toLocaleString(locale) })}
                </div>
                <div className="pt-2">
                  <Button variant="secondary" className="rounded-full px-6 py-3" onClick={exportAll}>
                    {t("cta.export")}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="mt-8 space-y-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit();
                }}
              >
                <div className="space-y-4">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                    {t("form.sections.personal")}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.name.label")}</div>
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder={t("form.fields.name.placeholder")}
                      />
                      {errors.name ? <div className="mt-2 text-xs text-rose-300">{errors.name}</div> : null}
                    </label>
                    <label className="block">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.email.label")}</div>
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder={t("form.fields.email.placeholder")}
                        inputMode="email"
                      />
                      {errors.email ? <div className="mt-2 text-xs text-rose-300">{errors.email}</div> : null}
                    </label>
                    <label className="block">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.telegram.label")}</div>
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.telegramWhatsApp}
                        onChange={(e) => setForm((p) => ({ ...p, telegramWhatsApp: e.target.value }))}
                        placeholder={t("form.fields.telegram.placeholder")}
                      />
                    </label>
                    <label className="block">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.wechat.label")}</div>
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.wechat}
                        onChange={(e) => setForm((p) => ({ ...p, wechat: e.target.value }))}
                        placeholder={t("form.fields.wechat.placeholder")}
                      />
                    </label>
                    <div className="md:col-span-2">
                      <PhoneField
                        label={t("form.fields.phoneGroup")}
                        countryLabel={t("form.fields.country.label")}
                        phoneLabel={t("form.fields.phone.label")}
                        value={form.phone}
                        onChange={(phone) => setForm((p) => ({ ...p, phone }))}
                        required
                        defaultCountry={locale === "zh" ? "CN" : "US"}
                        error={errors.phone}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                    {t("form.sections.status")}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.years.label")}</div>
                      <select
                        className="fx-select mt-2"
                        value={form.tradingYears}
                        onChange={(e) => setForm((p) => ({ ...p, tradingYears: e.target.value }))}
                      >
                        <option value="">{t("form.fields.years.placeholder")}</option>
                        <option value="lt1">{t("form.options.years.lt1")}</option>
                        <option value="1_3">{t("form.options.years.1_3")}</option>
                        <option value="3_5">{t("form.options.years.3_5")}</option>
                        <option value="5_10">{t("form.options.years.5_10")}</option>
                        <option value="10p">{t("form.options.years.10p")}</option>
                      </select>
                      {errors.tradingYears ? (
                        <div className="mt-2 text-xs text-rose-300">{errors.tradingYears}</div>
                      ) : null}
                    </label>

                    <label className="block">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.weekly.label")}</div>
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.weeklyFrequency}
                        onChange={(e) => setForm((p) => ({ ...p, weeklyFrequency: e.target.value }))}
                        placeholder={t("form.fields.weekly.placeholder")}
                      />
                      {errors.weeklyFrequency ? (
                        <div className="mt-2 text-xs text-rose-300">{errors.weeklyFrequency}</div>
                      ) : null}
                    </label>

                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.instruments.label")}</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {instrumentsOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100/90"
                          >
                            <input
                              type="checkbox"
                              checked={form.instruments.includes(opt.value)}
                              onChange={() => toggleMulti("instruments", opt.value)}
                              className="h-4 w-4 accent-sky-400"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.bottlenecks.label")}</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {bottleneckOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100/90"
                          >
                            <input
                              type="checkbox"
                              checked={form.bottlenecks.includes(opt.value)}
                              onChange={() => toggleMulti("bottlenecks", opt.value)}
                              className="h-4 w-4 accent-sky-400"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                    {t("form.sections.intent")}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.why.label")}</div>
                      <textarea
                        className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.whyJoin}
                        onChange={(e) => setForm((p) => ({ ...p, whyJoin: e.target.value }))}
                        placeholder={t("form.fields.why.placeholder")}
                      />
                      {errors.whyJoin ? <div className="mt-2 text-xs text-rose-300">{errors.whyJoin}</div> : null}
                    </label>

                    <label className="block md:col-span-2">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.goal.label")}</div>
                      <textarea
                        className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                        value={form.goal90d}
                        onChange={(e) => setForm((p) => ({ ...p, goal90d: e.target.value }))}
                        placeholder={t("form.fields.goal.placeholder")}
                      />
                      {errors.goal90d ? <div className="mt-2 text-xs text-rose-300">{errors.goal90d}</div> : null}
                    </label>

                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.challenge.label")}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["yes", "no"] as const).map((v) => (
                          <label
                            key={v}
                            className={[
                              "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                              form.challenge === v
                                ? "border-sky-400/40 bg-sky-400/10 text-slate-50"
                                : "border-white/10 bg-white/5 text-slate-100/90"
                            ].join(" ")}
                          >
                            <input
                              type="radio"
                              name="challenge"
                              value={v}
                              checked={form.challenge === v}
                              onChange={() => setForm((p) => ({ ...p, challenge: v }))}
                              className="h-4 w-4 accent-sky-400"
                            />
                            <span>{t(`form.options.challenge.${v}`)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                    {t("form.sections.thoughts")}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200/70">{t("form.fields.thoughts.label")}</div>
                    <div className="mt-3">
                      <RichTextEditor
                        value={form.thoughtsHtml}
                        onChange={(next) => setForm((p) => ({ ...p, thoughtsHtml: next }))}
                        placeholder={t("form.fields.thoughts.placeholder")}
                        aria-label={t("form.fields.thoughts.label")}
                      />
                    </div>
                    {errors.thoughtsHtml ? (
                      <div className="mt-2 text-xs text-rose-300">{errors.thoughtsHtml}</div>
                    ) : null}
                  </div>
                </div>

                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {globalError ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {globalError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="primary" className="rounded-full px-6 py-3" type="submit">
                    {t("form.actions.submit")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-slate-200/70 hover:text-slate-50"
                  >
                    {t("form.actions.cancel")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
