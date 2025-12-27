import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import type { SystemRole } from "@/lib/system/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().optional(),
  identifier: z.string().min(3).optional(),
  password: z.string().min(6).max(128),
  role: z.enum(["student", "leader", "super_admin"])
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

  const email = String(parsed.data.email || parsed.data.identifier || "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "INVALID_EMAIL" }, 400);

  const expectedRole = parsed.data.role as SystemRole;

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password
    });

    if (error || !data.user?.id) {
      return json({ ok: false, error: "INVALID_CREDENTIALS" }, 401);
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id,full_name,role,status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileErr || !profile?.id) {
      await supabase.auth.signOut();
      return json({ ok: false, error: "NO_PROFILE" }, 403);
    }

    if ((profile as any).status === "frozen") {
      await supabase.auth.signOut();
      return json({ ok: false, error: "ACCOUNT_FROZEN" }, 403);
    }

    if (profile.role !== expectedRole) {
      await supabase.auth.signOut();
      return json({ ok: false, error: "ROLE_MISMATCH" }, 403);
    }

    return json({
      ok: true,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role
      }
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "LOGIN_FAILED" }, 500);
  }
}
