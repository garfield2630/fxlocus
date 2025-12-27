import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type NormalizedRole = "super_admin" | "leader" | "student";
type ProfileRow = { id: string; email: string | null; role: string };

function normalizeRole(input: unknown): NormalizedRole | null {
  const value = typeof input === "string" ? input.trim() : "";
  if (value === "\u8d85\u7ba1" || value === "super_admin") return "super_admin";
  if (value === "\u56e2\u961f\u957f" || value === "team_leader" || value === "leader") return "leader";
  if (value === "\u5b66\u5458" || value === "student") return "student";
  return null;
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return json({ error: "Missing env", url: !!url, anon: !!anon }, 500);
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
      return json(
        { error: "Missing email/password", got: { keys: body ? Object.keys(body) : null } },
        400
      );
    }
    if (!expectedRole) {
      return json(
        { error: "Invalid role", roleRaw, got: { keys: body ? Object.keys(body) : null } },
        400
      );
    }

    const cookieStore = cookies();
    const host = req.headers.get("host") || "";
    const hostName = host.split(":")[0] || "";
    const cookieDomain =
      hostName === "fxlocus.com" || hostName.endsWith(".fxlocus.com") ? ".fxlocus.com" : undefined;
    const forwardedProto = req.headers.get("x-forwarded-proto") || "";
    const isSecure = forwardedProto === "https" || req.nextUrl.protocol === "https:";

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
      },
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: isSecure,
        domain: cookieDomain
      }
    });

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data?.user) {
      return json(
        { error: "Invalid credentials", message: signInError?.message ?? null },
        401
      );
    }

    let profile: ProfileRow | null = null;
    let adminError: string | null = null;

    try {
      const admin = createSupabaseAdminClient();
      const { data: adminProfile, error: adminErr } = await admin
        .from("profiles")
        .select("id,email,role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (adminErr) {
        adminError = adminErr.message;
      } else {
        profile = adminProfile as typeof profile;
      }
    } catch (e: any) {
      adminError = e?.message ?? "ADMIN_PROFILE_QUERY_FAILED";
    }

    if (!profile) {
      const { data: fallbackProfile, error: fallbackErr } = await supabase
        .from("profiles")
        .select("id,email,role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (fallbackErr) {
        console.error("profiles query error:", fallbackErr);
        await supabase.auth.signOut();
        return json(
          { error: "Profile query failed", message: fallbackErr.message, adminError },
          500
        );
      }

      profile = fallbackProfile as typeof profile;
    }

    if (!profile) {
      await supabase.auth.signOut();
      return json(
        { error: "Profile missing", hint: "Run backfill: insert missing profiles from auth.users" },
        500
      );
    }

    const resolvedProfile = profile as ProfileRow;

    if (resolvedProfile.role !== expectedRole) {
      await supabase.auth.signOut();
      return json(
        { error: "NO_PERMISSION", expectedRole, actualRole: resolvedProfile.role },
        403
      );
    }

    return json({
      ok: true,
      role: resolvedProfile.role,
      data: {
        role: resolvedProfile.role,
        profile: {
          id: resolvedProfile.id,
          email: resolvedProfile.email,
          role: resolvedProfile.role
        }
      },
      profile: {
        id: resolvedProfile.id,
        email: resolvedProfile.email,
        role: resolvedProfile.role
      },
      user: {
        id: resolvedProfile.id,
        email: resolvedProfile.email,
        full_name: null,
        role: resolvedProfile.role
      }
    });
  } catch (e: any) {
    console.error("login route crashed:", e);
    return json({ error: "Unhandled", message: e?.message ?? String(e) }, 500);
  }
}
