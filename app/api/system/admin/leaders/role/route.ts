import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z
  .object({
    targetId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    toRole: z.enum(["student", "leader", "super_admin"]),
    leaderId: z.string().uuid().optional(),
    reason: z.string().max(500).optional()
  })
  .refine((v) => Boolean(v.targetId) !== Boolean(v.email), { message: "Provide targetId or email" });

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user: actor, supabase } = await requireSuperAdmin();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const now = new Date().toISOString();
    const email = parsed.data.email?.trim().toLowerCase();

    const { data: target, error: targetErr } = parsed.data.targetId
      ? await supabase.from("profiles").select("id,email,role").eq("id", parsed.data.targetId).maybeSingle()
      : await supabase.from("profiles").select("id,email,role").eq("email", email!).maybeSingle();

    if (targetErr) return json({ ok: false, error: targetErr.message }, 500);
    if (!target?.id) return json({ ok: false, error: "NOT_FOUND" }, 404);
    if (target.id === actor.id) return json({ ok: false, error: "CANNOT_EDIT_SELF" }, 400);

    const fromRole = target.role;
    const toRole = parsed.data.toRole;
    if (fromRole === toRole) return json({ ok: true, id: target.id, role: toRole });

    let leaderId: string | null = null;
    if (toRole === "student") {
      leaderId = parsed.data.leaderId || null;
      if (leaderId) {
        const { data: leader, error: leaderErr } = await supabase
          .from("profiles")
          .select("id,role")
          .eq("id", leaderId)
          .maybeSingle();
        if (leaderErr) return json({ ok: false, error: leaderErr.message }, 500);
        if (!leader?.id || leader.role !== "leader") return json({ ok: false, error: "INVALID_LEADER" }, 400);
      }
    }

    const patch: Record<string, unknown> = {
      role: toRole,
      updated_at: now
    };

    if (toRole === "student") {
      patch.leader_id = leaderId;
    } else {
      patch.leader_id = null;
    }

    const up = await supabase
      .from("profiles")
      .update(patch as any)
      .eq("id", target.id)
      .select("id,role")
      .maybeSingle();

    if (up.error) return json({ ok: false, error: up.error.message }, 500);
    if (!up.data?.id) return json({ ok: false, error: "UPDATE_FAILED" }, 500);

    const audit = await supabase.from("role_audit_logs").insert({
      target_id: target.id,
      actor_id: actor.id,
      from_role: fromRole,
      to_role: toRole,
      reason: parsed.data.reason || null,
      created_at: now
    } as any);

    if (audit.error) return json({ ok: true, id: target.id, role: toRole, audit: "FAILED" });
    return json({ ok: true, id: target.id, role: toRole });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

