import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";

import { CourseAccessGateClient } from "@/components/system/CourseAccessGateClient";
import { CoursePlayerClient } from "@/components/system/CoursePlayerClient";
import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursePage({
  params
}: {
  params: { locale: "zh" | "en"; id: string };
}) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const courseId = Number(params.id);
  if (!courseId || courseId < 1 || courseId > 20) redirect(`/${locale}/system/courses`);

  const auth = await getSystemAuth();
  if (!auth.ok) return null;

  const admin = supabaseAdmin();
  const [{ data: course }, { data: access }, { data: note }] = await Promise.all([
    admin.from("courses").select("*").eq("id", courseId).maybeSingle(),
    admin.from("course_access").select("*").eq("user_id", auth.user.id).eq("course_id", courseId).maybeSingle(),
    admin.from("course_notes").select("*").eq("user_id", auth.user.id).eq("course_id", courseId).maybeSingle()
  ]);

  if (!course) redirect(`/${locale}/system/courses`);

  const status = (access as any)?.status || "none";
  const canView = status === "approved" || status === "completed";

  if (!canView) {
    return (
      <CourseAccessGateClient
        locale={locale}
        courseId={courseId}
        status={status}
        rejectionReason={(access as any)?.rejection_reason || null}
      />
    );
  }

  const publishedRaw = (course as any)?.published;
  const deletedAt = (course as any)?.deleted_at;
  const isPublished = !deletedAt && (typeof publishedRaw === "boolean" ? publishedRaw : true);

  const bucket = (course as any)?.content_bucket;
  const path = (course as any)?.content_path;
  const mime = String((course as any)?.content_mime_type || "");
  const fileName = (course as any)?.content_file_name || null;

  let signedUrl: string | null = null;
  if (bucket && path) {
    const signed = await admin.storage.from(bucket).createSignedUrl(path, 3600);
    if (!signed.error) signedUrl = signed.data.signedUrl;
  }

  const courseForClient: any = { ...course };
  if (signedUrl) {
    if (mime.startsWith("video/")) {
      courseForClient.video_url = signedUrl;
    } else if (mime === "application/pdf" || mime.startsWith("image/") || mime.startsWith("text/")) {
      courseForClient.doc_url = signedUrl;
    } else {
      courseForClient.content_url = signedUrl;
      courseForClient.content_file_name = fileName;
      courseForClient.content_mime_type = mime || null;
    }
  }

  const hasContent = Boolean(courseForClient.video_url || courseForClient.doc_url || courseForClient.content_url);
  if (!isPublished || !hasContent) {
    return (
      <div className="space-y-6 max-w-[900px]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-white/90 font-semibold text-xl">
            {locale === "zh" ? `第${courseId}课` : `Lesson ${courseId}`}
          </div>
          <div className="mt-3 text-white/60 text-sm leading-6">
            {locale === "zh" ? "课程内容尚未发布。" : "Course content is not published yet."}
          </div>
          <div className="mt-4">
            <a
              className="inline-flex px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
              href={`/${locale}/system/courses`}
            >
              {locale === "zh" ? "返回课程列表" : "Back to courses"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CoursePlayerClient
      locale={locale}
      course={courseForClient}
      access={access as any}
      initialNote={note?.content_md || ""}
    />
  );
}

