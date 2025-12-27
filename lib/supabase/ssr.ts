import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function mustGetEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function createSupabaseServerClient() {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. Middleware/Route Handlers can.
        }
      }
    }
  });
}

