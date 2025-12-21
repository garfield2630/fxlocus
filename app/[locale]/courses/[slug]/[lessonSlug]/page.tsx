import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { LessonProgressControls } from "@/components/courses/LessonProgressControls";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getDataProvider } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

type Props = {
  params: { locale: Locale; slug: string; lessonSlug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = getDataProvider();
  const result = await provider.getCourseLesson(params.locale, params.slug, params.lessonSlug);
  if (!result) return {};
  const lesson = result.course.lessons[result.lessonIndex];
  return { title: lesson.title };
}

export default async function CourseLessonPage({ params }: Props) {
  const locale = params.locale;
  const provider = getDataProvider();
  const result = await provider.getCourseLesson(locale, params.slug, params.lessonSlug);
  if (!result) notFound();

  const { course, lessonIndex } = result;
  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;

  const t = await getTranslations({ locale, namespace: "courses" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const html = lesson.contentMd ? await renderMarkdown(lesson.contentMd) : "";

  return (
    <div className="space-y-10">
      <header className="pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
              {course.title}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              {lesson.title}
            </h1>
          </div>

          <Link href={`/courses/${course.slug}`} locale={locale} className="fx-btn fx-btn-secondary">
            {t("backToCourse")}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-200/70">
          {lesson.durationMin ? (
            <span>
              {lesson.durationMin}
              {tCommon("ui.minutesShort")}
            </span>
          ) : null}
        </div>
      </header>

      {lesson.videoEmbedUrl ? (
        <section className="fx-section">
          <div className="fx-card p-3">
            <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <iframe
                src={lesson.videoEmbedUrl}
                title={lesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      ) : null}

      {html ? (
        <section className="fx-section">
          <article className="fx-card p-7">
            <div
              className="prose prose-invert max-w-none prose-headings:scroll-mt-28 prose-a:text-sky-300 prose-strong:text-slate-50"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>
        </section>
      ) : null}

      <section className="fx-section">
        <LessonProgressControls
          courseSlug={course.slug}
          lessonSlug={lesson.slug}
          prevHref={prevLesson ? `/courses/${course.slug}/${prevLesson.slug}` : undefined}
          nextHref={nextLesson ? `/courses/${course.slug}/${nextLesson.slug}` : undefined}
        />
      </section>

      <section className="fx-section">
        <div className="fx-card p-7">
          <h2 className="text-sm font-semibold tracking-[0.16em] text-slate-200/70">
            {t("navigationTitle")}
          </h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={prevLesson ? `/courses/${course.slug}/${prevLesson.slug}` : `/courses/${course.slug}`}
              locale={locale}
              className="fx-btn fx-btn-secondary"
              aria-disabled={!prevLesson}
            >
              {prevLesson ? t("prevLesson") : t("backToCourse")}
            </Link>
            {nextLesson ? (
              <Link href={`/courses/${course.slug}/${nextLesson.slug}`} locale={locale} className="fx-btn fx-btn-primary">
                {t("nextLesson")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
