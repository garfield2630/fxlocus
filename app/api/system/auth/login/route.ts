import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type NormalizedRole = "super_admin" | "leader" | "student";

function normalizeRole(input: unknown): NormalizedRole | null {
  const value = typeof input === "string" ? input.trim() : "";
  if (value === "\u8d85\u7ba1" || value === "super_admin") return "super_admin";
  if (value === "\u56e2\u961f\u957f" || value === "team_leader" || value === "leader") return "leader";
  if (value === "\u5b66\u5458" || value === "student") return "student";
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
const email = String(body?.email ?? body?.identifier ?? body?.username ?? "").trim();
const password = String(body?.password ?? body?.pwd ?? "").trim();

    const roleRaw =
      body?.role ??
      body?.accountType ??
      body?.type ??
      body?.loginAs ??
      body?.identity;
    const expectedRole = normalizeRole(roleRaw);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email/password", got: { keys: body ? Object.keys(body) : null } },
        { status: 400 }
      );
    }
    if (!expectedRole) {
      return NextResponse.json(
        { error: "Invalid role", roleRaw, got: { keys: body ? Object.keys(body) : null } },
        { status: 400 }
      );
    }

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
        }
      }
    });

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data?.user) {
      return NextResponse.json(
        { error: "Invalid credentials", message: signInError?.message ?? null },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("id,email,role")
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
