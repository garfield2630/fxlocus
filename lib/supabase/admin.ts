import "server-only";

import { createClient } from "@supabase/supabase-js";

function mustGetEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function createSupabaseAdminClient() {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  const service = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, service, {
    auth: { persistSession: false }
  });
}

export const supabaseAdmin = createSupabaseAdminClient;
