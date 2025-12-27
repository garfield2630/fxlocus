export function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export const ENV = {
  SUPABASE_URL: () => process.env.SUPABASE_URL || mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: () => mustGetEnv("SUPABASE_SERVICE_ROLE_KEY"),
  RESEND_API_KEY: () => process.env.RESEND_API_KEY ?? "",
  APP_BASE_URL: () => process.env.APP_BASE_URL ?? ""
} as const;
