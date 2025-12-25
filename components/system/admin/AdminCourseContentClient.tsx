"use client";

import React from "react";

type CourseRow = {
  id: number;
  title_zh?: string | null;
  title_en?: string | null;
  published?: boolean | null;
  deleted_at?: string | null;
  content_bucket?: string | null;
  content_path?: string | null;
  content_file_name?: string | null;
  content_mime_type?: string | null;
};

export function AdminCourseContentClient({
  locale,
  initialCourses
}: {
  locale: "zh" | "en";
  initialCourses: CourseRow[];
}) {
  const [courses, setCourses] = React.useState<CourseRow[]>(initialCourses);
  const [busy, setBusy] = React.useState<Record<number, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [fileById, setFileById] = React.useState<Record<number, File | null>>({});

  const updateLocal = (course: CourseRow) => {
    setCourses((prev) => prev.map((c) => (c.id === course.id ? course : c)));
  };

  const saveMeta = async (course: CourseRow) => {
    setBusy((p) => ({ ...p, [course.id]: true }));
    setError(null);
    try {
      const res = await fetch("/api/system/admin/courses/update-meta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          title_zh: course.title_zh ?? "",
          title_en: course.title_en ?? "",
          published: Boolean(course.published)
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "save_failed");
      if (json.course) updateLocal(json.course);
    } catch (e: any) {
      setError(e?.message || "save_failed");
    } finally {
      setBusy((p) => ({ ...p, [course.id]: false }));
    }
  };

  const upload = async (course: CourseRow) => {
    const file = fileById[course.id] || null;
    if (!file) return;
    setBusy((p) => ({ ...p, [course.id]: true }));
    setError(null);
    try {
      const fd = new FormData();
      fd.set("courseId", String(course.id));
      fd.set("file", file);
      const res = await fetch("/api/system/admin/courses/upload-content", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "upload_failed");
      if (json.course) updateLocal(json.course);
      setFileById((p) => ({ ...p, [course.id]: null }));
    } catch (e: any) {
      setError(e?.message || "upload_failed");
    } finally {
      setBusy((p) => ({ ...p, [course.id]: false }));
    }
  };

  const toggleDeleted = async (course: CourseRow, deleted: boolean) => {
    setBusy((p) => ({ ...p, [course.id]: true }));
    setError(null);
    try {
      const res = await fetch("/api/system/admin/courses/update-meta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: course.id, deleted })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
      if (json.course) updateLocal(json.course);
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setBusy((p) => ({ ...p, [course.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "课程内容管理" : "Course content"}
        </div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "上传课程内容文件，并设置标题/上下架/软删除。"
            : "Upload course content files and manage title/publish/delete."}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {courses.map((c) => {
          const isBusy = Boolean(busy[c.id]);
          const deleted = Boolean(c.deleted_at);
          return (
            <div key={c.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-white/90 font-semibold">
                  {locale === "zh" ? `第${c.id}课` : `Lesson ${c.id}`}
                </div>
                {deleted ? (
                  <span className="text-xs rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-100">
                    {locale === "zh" ? "已删除" : "Deleted"}
                  </span>
                ) : null}
                <label className="ml-auto flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={Boolean(c.published) && !deleted}
                    disabled={deleted}
                    onChange={(e) =>
                      setCourses((prev) =>
                        prev.map((x) =>
                          x.id === c.id ? { ...x, published: e.target.checked } : x
                        )
                      )
                    }
                  />
                  {locale === "zh" ? "已发布" : "Published"}
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={c.title_zh || ""}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, title_zh: e.target.value } : x))
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
                  placeholder={locale === "zh" ? "中文标题" : "Title (ZH)"}
                />
                <input
                  value={c.title_en || ""}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, title_en: e.target.value } : x))
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
                  placeholder={locale === "zh" ? "英文标题" : "Title (EN)"}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/50">{locale === "zh" ? "内容" : "Content"}</div>
                  <div className="mt-2 text-sm text-white/80 break-all">
                    {c.content_file_name || c.content_path || (locale === "zh" ? "未上传" : "Not uploaded")}
                  </div>
                  {c.content_path ? (
                    <div className="mt-2 text-xs text-white/45 break-all">
                      {c.content_bucket}/{c.content_path}
                    </div>
                  ) : null}
                </div>

                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="text-xs text-white/50">{locale === "zh" ? "上传/替换内容" : "Upload/replace"}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => setFileById((p) => ({ ...p, [c.id]: e.target.files?.[0] || null }))}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 text-sm"
                    />
                    <button
                      type="button"
                      disabled={isBusy || !fileById[c.id]}
                      onClick={() => upload(c)}
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      {locale === "zh" ? "上传" : "Upload"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => saveMeta(c)}
                      className="ml-auto px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
                    >
                      {locale === "zh" ? "保存设置" : "Save"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {deleted ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleDeleted(c, false)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
                      >
                        {locale === "zh" ? "恢复" : "Restore"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleDeleted(c, true)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
                      >
                        {locale === "zh" ? "软删除" : "Soft delete"}
                      </button>
                    )}
                    <div className="ml-auto text-xs text-white/45">
                      {c.deleted_at ? `${locale === "zh" ? "删除时间" : "Deleted at"}: ${new Date(c.deleted_at).toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

