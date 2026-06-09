import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Supabase client (publishable key, no auth session — demo login is client-side). */
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

/** Single demo restaurant slug for this prototype. */
export const SHOP_SLUG = "khrua-khun-nai";
