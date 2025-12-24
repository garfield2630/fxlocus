"use client";

import React from "react";
import { useRouter } from "next/navigation";

type CourseRow = {
  id: number;
  title_en: string;
  title_zh: string;
  content_type: "video" | "doc" | "mixed";
  video_url?: string | null;
  doc_url?: string | null;
};

type AccessRow = {
  id: string;
  course_id: number;
  status: string;
  progress: number;
  last_video_sec: number;
};

export function CoursePlayerClient({
  locale,
  course,
  access,
  initialNote
}: {
  locale: "zh" | "en";
  course: CourseRow;
  access: AccessRow;
  initialNote: string;
}) {
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [note, setNote] = React.useState(initialNote);
  const [savingNote, setSavingNote] = React.useState(false);
  const [savingProgress, setSavingProgress] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (access?.last_video_sec) {
      v.currentTime = Math.max(0, access.last_video_sec);
    }
  }, [access?.last_video_sec]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let lastSent = 0;
    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSent < 10_000) return;
      lastSent = now;
      const sec = Math.floor(v.currentTime || 0);
      const duration = v.duration || 0;
      const progress = duration ? Math.min(99, Math.floor((sec / duration) * 100)) : null;
      setSavingProgress(true);
      fetch(`/api/system/courses/${course.id}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lastVideoSec: sec, progress })
      })
        .then(() => {})
        .finally(() => setSavingProgress(false));
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [course.id]);

  const saveNote = async () => {
    setError(null);
    setSavingNote(true);
    try {
      const res = await fetch(`/api/system/courses/${course.id}/notes`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentMd: note })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(locale === "zh" ? "保存失败" : "Save failed");
      } else {
        router.refresh();
      }
    } catch {
      setError(locale === "zh" ? "网络错误" : "Network error");
    } finally {
      setSavingNote(false);
    }
  };

  const complete = async () => {
    setError(null);
    const res = await fetch(`/api/system/courses/${course.id}/complete`, { method: "POST" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      setError(locale === "zh" ? "操作失败" : "Failed");
      return;
    }
    router.replace(`/${locale}/system/courses`);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
      <aside className="hidden xl:block rounded-3xl border border-white/10 bg-white/5 p-4 overflow-y-auto">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "课程目录" : "Course tree"}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const id = i + 1;
            return (
              <a
                key={id}
                href={`/${locale}/system/courses/${id}`}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  id === course.id
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/0 border-white/10 text-white/70 hover:bg-white/5"
                }`}
              >
                {locale === "zh" ? `第${id}课` : `L${id}`}
              </a>
            );
          })}
        </div>
      </aside>

      <main className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden min-h-0 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="text-white/90 font-semibold text-lg">
            {locale === "zh" ? course.title_zh : course.title_en}
          </div>
          <div className="mt-1 text-xs text-white/50 flex items-center gap-2">
            <span>{savingProgress ? (locale === "zh" ? "进度保存中…" : "Saving…") : null}</span>
            <span className="ml-auto">
              <button
                type="button"
                onClick={complete}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15"
              >
                {locale === "zh" ? "标记完成" : "Mark complete"}
              </button>
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {course.video_url ? (
            <video ref={videoRef} className="h-full w-full" controls src={course.video_url || undefined} />
          ) : course.doc_url ? (
            <iframe className="h-full w-full" src={course.doc_url || undefined} />
          ) : (
            <div className="p-6 text-white/60">{locale === "zh" ? "课程内容未配置。" : "Content not configured."}</div>
          )}
        </div>
      </main>

      <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 min-h-0 flex flex-col">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "笔记" : "Notes"}</div>
        <div className="mt-2 text-xs text-white/50">{locale === "zh" ? "Markdown 记录" : "Markdown"}</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-3 flex-1 min-h-0 w-full rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
          placeholder={locale === "zh" ? "写下：叙事/关键位/证伪点/执行…" : "Write: context/levels/invalidation/execution…"}
        />
        {error ? (
          <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={savingNote}
            onClick={saveNote}
            className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
          >
            {locale === "zh" ? "保存笔记" : "Save"}
          </button>
          <a className="ml-auto text-sm text-white/60 hover:text-white" href={`/${locale}/system/files`}>
            {locale === "zh" ? "查看资料" : "Files"}
          </a>
        </div>
      </aside>
    </div>
  );
}

