import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function normalizeRole(input: unknown) {
  const v = typeof input === "string" ? input.trim() : "";
  if (v === "超管" || v === "super_admin") return "super_admin";
  if (v === "团队长" || v === "team_leader" || v === "leader") return "team_leader";
  if (v === "学员" || v === "student") return "student";
  return null;
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json({ error: "Missing env", url: !!url, anon: !!anon }, { status: 500 });
  }

  try {
    const body = (await req.json().catch(() => null)) as any;
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const expectedRole = normalizeRole(body?.role ?? body?.accountType);

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
    }
    if (!expectedRole) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // 1) 用 SSR client 登录，写 cookie
    const cookieStore = cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data?.user) {
      return NextResponse.json(
        { error: "Invalid credentials", message: signInError?.message ?? null },
        { status: 401 }
      );
    }

    // 2) 用 admin client 查 profiles（绕过 RLS）
    const admin = createSupabaseAdminClient();
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("id,email,role") // 只查你肯定有的列，避免列不存在
      .eq("id", data.user.id)
      .maybeSingle();

    if (pErr) {
      console.error("profiles query error:", pErr);
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Profile query failed", message: pErr.message }, { status: 500 });
    }

    if (!profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Profile missing", hint: "Run backfill: insert missing profiles from auth.users" },
        { status: 500 }
      );
    }

    if (profile.role !== expectedRole) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "NO_PERMISSION", expectedRole, actualRole: profile.role },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, role: profile.role });
  } catch (e: any) {
    console.error("login route crashed:", e);
    return NextResponse.json({ error: "Unhandled", message: e?.message ?? String(e) }, { status: 500 });
  }
}
