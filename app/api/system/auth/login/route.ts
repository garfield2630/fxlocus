import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NormalizedRole = "super_admin" | "leader" | "student";

function normalizeRole(input: unknown): NormalizedRole | null {
  const value = typeof input === "string" ? input.trim() : "";
  if (value === "\u8d85\u7ba1" || value === "super_admin") return "super_admin";
  if (value === "\u56e2\u961f\u957f" || value === "leader") return "leader";
  if (value === "\u5b66\u5458" || value === "student") return "student";
  return null;
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let supabase: ReturnType<typeof createSupabaseServerClient> | null = null;

  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? body?.identifier ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const expectedRole = normalizeRole(body?.role ?? body?.loginAs);

    if (!email || !password) {
      return json({ error: "Missing email/password" }, 400);
    }
    if (!expectedRole) {
      return json({ error: "Invalid role" }, 400);
    }

    supabase = createSupabaseServerClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !data?.user) {
      return json(
        { error: "Invalid credentials", message: signInError?.message ?? null },
        401
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,email,role,leader_id,status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      return json(
        { error: "Profile query failed", message: profileError.message },
        500
      );
    }

    if (!profile) {
      await supabase.auth.signOut();
      return json(
        { error: "Profile not found (trigger may not have run)" },
        500
      );
    }

    if (profile.status === "frozen") {
      await supabase.auth.signOut();
      return json({ error: "ACCOUNT_FROZEN" }, 403);
    }

    if (profile.role !== expectedRole) {
      await supabase.auth.signOut();
      return json(
        { error: "NO_PERMISSION", expectedRole, actualRole: profile.role },
        403
      );
    }

    return json({ ok: true, role: profile.role });
  } catch (e: any) {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    return json({ error: "Unhandled", message: e?.message ?? "Unknown" }, 500);
  }
}
