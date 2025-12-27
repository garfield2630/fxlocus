import { createClient } from "@supabase/supabase-js";

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a?.startsWith("--")) continue;
    const key = a.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    out[key] = value;
    i += 1;
  }
  return out;
}

async function findUserIdByEmail(admin: any, email: string) {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 });
  if (list.error) throw new Error(list.error.message);
  const found = list.data.users.find((u: any) => String(u.email || "").toLowerCase() === email.toLowerCase());
  return found?.id || null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const fullName = args.name || args.full_name || "FxLocus Super Admin";
  const email = String(args.email || "").trim().toLowerCase();
  const phone = String(args.phone || "").trim();
  const password = args.password;

  if (!email) throw new Error("Missing --email");
  if (!password) throw new Error("Missing --password");

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  const key = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(url, key, { auth: { persistSession: false } });

  let userId: string | null = null;
  const createRes = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: phone || null }
  });

  if (createRes.error) {
    userId = await findUserIdByEmail(admin, email);
    if (!userId) throw new Error(createRes.error.message);

    const up = await admin.auth.admin.updateUserById(userId, {
      email,
      password,
      user_metadata: { full_name: fullName, phone: phone || null }
    });
    if (up.error) throw new Error(up.error.message);
  } else {
    userId = createRes.data.user?.id || null;
  }

  if (!userId) throw new Error("FAILED_TO_RESOLVE_USER_ID");

  const upProfile = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      phone: phone || null,
      role: "super_admin",
      leader_id: null,
      status: "active"
    } as any,
    { onConflict: "id" }
  );
  if (upProfile.error) throw new Error(upProfile.error.message);

  console.log(`Super admin ready: ${email} (${userId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
