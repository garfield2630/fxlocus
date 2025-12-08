import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 说明：
// - 浏览器端使用 NEXT_PUBLIC_ 前缀的变量；
// - 这些变量需要在 Vercel Project Settings -> Environment Variables 里配置；
// - 本文件目前在项目中还没有被实际调用，你以后接学员管理 / 课程系统时直接复用即可。

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 未配置：请在环境变量中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。"
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true
    }
  });

  return browserClient;
}

