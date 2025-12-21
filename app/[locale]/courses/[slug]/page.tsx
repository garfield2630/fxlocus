import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseProgressSummary } from "@/components/courses/CourseProgressSummary";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getDataProvider } from "@/lib/data";
import type { Pillar } from "@/lib/domain/types";

type Props = {
  params: { locale: Locale; slug: string };
};

function labelKey(pillar: Pillar) {
  if (pillar === "mind") return "mind";
  if (pillar === "market") return "market";
  return "price";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = getDataProvider();
  const course = await provider.getCourse(params.locale, params.slug);
  if (!course) return {};
  return { title: course.title, description: course.excerpt };
}

export default async function CourseDetailPage({ params }: Props) {
  const locale = params.locale;
  const provider = getDataProvider();
  const course = await provider.getCourse(locale, params.slug);
  if (!course) notFound();

  const t = await getTranslations({ locale, namespace: "courses" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const lessons = [...course.lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-12">
      <header className="pt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200/70">
          <span className="fx-pill">{tCommon(`labels.${labelKey(course.pillar)}` as any)}</span>
          <span className="fx-pill">{t(`access.${course.access}`)}</span>
          <span className="fx-pill">{t(`level.${course.level}`)}</span>
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {course.title}
        </h1>
        <p className="fx-lead">{course.excerpt}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/courses" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.back")}
          </Link>
          <Link href="/framework" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.enterFramework")}
          </Link>
        </div>
      </header>

      <section className="fx-section">
        <div className="fx-card p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                {t("lessonsTitle")}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-200/75">
                {t("lessonsLead", { count: lessons.length })}
              </p>
            </div>
            <CourseProgressSummary courseSlug={course.slug} totalLessons={lessons.length} />
          </div>

          <div className="mt-8 grid gap-3">
            {lessons.map((lesson, idx) => (
              <Link
                key={lesson.slug}
                href={`/courses/${course.slug}/${lesson.slug}`}
                locale={locale}
                className="fx-glass block border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/55">
                      {t("lessonLabel", { index: idx + 1 })}
                    </div>
                    <div className="mt-2 truncate text-base font-semibold text-slate-50">
                      {lesson.title}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                    {lesson.durationMin ? `${lesson.durationMin}${tCommon("ui.minutesShort")}` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
