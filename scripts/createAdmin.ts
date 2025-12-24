import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const fullName = args.name || args.full_name || "FxLocus Admin";
  const email = args.email || "";
  const phone = args.phone || "";
  const password = args.password;

  if (!password) {
    throw new Error("Missing --password");
  }
  if (!email && !phone) {
    throw new Error("Provide --email or --phone");
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  const key = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(url, key, { auth: { persistSession: false } });

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("system_users")
    .insert({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      password_hash: passwordHash,
      role: "admin",
      status: "active",
      must_change_password: false,
      default_open_courses: 0,
      created_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  console.log(`Created admin user: ${data.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

