import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/system/guard";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  password: z.string().min(8).max(64),
  reason: z.string().max(500).optional().or(z.literal(""))
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user: actor } = await requireSuperAdmin();

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const email = parsed.data.email.trim().toLowerCase();
    if (!isStrongSystemPassword(parsed.data.password)) {
      return json({ ok: false, error: "WEAK_PASSWORD" }, 400);
    }

    const admin = supabaseAdmin();

    const created = await admin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: parsed.data.fullName ? { full_name: parsed.data.fullName } : undefined
    });

    if (created.error || !created.data.user?.id) {
      return json({ ok: false, error: created.error?.message || "AUTH_CREATE_FAILED" }, 500);
    }

    const userId = created.data.user.id;
    const now = new Date().toISOString();

    const upsertProfile = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: parsed.data.fullName || null,
        phone: parsed.data.phone?.trim() || null,
        role: "leader",
        leader_id: null,
        status: "active",
        created_at: now,
        updated_at: now
      } as any,
      { onConflict: "id" }
    );

    if (upsertProfile.error) {
      await admin.auth.admin.deleteUser(userId);
      return json({ ok: false, error: upsertProfile.error.message }, 500);
    }

    const audit = await admin.from("role_audit_logs").insert({
      target_id: userId,
      actor_id: actor.id,
      from_role: "student",
      to_role: "leader",
      reason: parsed.data.reason?.trim() || "create_leader",
      created_at: now
    } as any);

    if (audit.error) {
      return json({ ok: true, id: userId, audit: "FAILED" });
    }

    return json({ ok: true, id: userId });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

