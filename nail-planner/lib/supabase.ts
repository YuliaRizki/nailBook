import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing Supabase Environment Variables! Check your .env.local file."
  );
} else {
  console.log("✅ Supabase Client Initialized", {
    url: supabaseUrl ? "Found" : "Missing",
  });
}

// Fallback to empty string to prevent build crash, but log error.
// The app will fail at runtime if not fixed, but build will pass.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
