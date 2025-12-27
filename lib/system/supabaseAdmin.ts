import "server-only";
import { createClient } from "@supabase/supabase-js";

import { ENV } from "./env";

export function supabaseAdmin() {
  return createClient(ENV.SUPABASE_URL(), ENV.SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { persistSession: false }
  });
}
