import { createClient, SupabaseClient } from "@supabase/supabase-js";

// This client file supports Lovable's Supabase integration.
// It will use runtime-injected keys when available, and otherwise provide
// a safe fallback so the app can build and run without crashing.

type AnyClient = SupabaseClient<any, any, any>;

declare global {
  interface Window {
    __SUPABASE_URL__?: string;
    __SUPABASE_ANON_KEY__?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  }
}

const url =
  (typeof window !== "undefined" &&
    (window.__SUPABASE_URL__ || window.SUPABASE_URL)) ||
  "";
const anonKey =
  (typeof window !== "undefined" &&
    (window.__SUPABASE_ANON_KEY__ || window.SUPABASE_ANON_KEY)) ||
  "";

let supabase: AnyClient | any;

if (url && anonKey) {
  supabase = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn(
    "Supabase not configured yet. Connect Supabase in Lovable to enable authentication."
  );
  const dummyAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_event: any, _session: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => {
      throw new Error("Supabase not configured");
    },
    signUp: async () => {
      throw new Error("Supabase not configured");
    },
    signOut: async () => ({ error: null }),
  };
  supabase = { auth: dummyAuth } as any;
}

export { supabase };
