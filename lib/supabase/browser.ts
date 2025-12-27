import { createBrowserClient } from "@supabase/ssr";

function mustGetEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function createSupabaseBrowserClient() {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createBrowserClient(url, anon);
}
