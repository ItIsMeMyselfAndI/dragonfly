import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // In client-side code, we might not want to throw an error immediately
  // but we should log a warning.
  console.warn('Supabase environment variables are missing. Please check .env.local');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
