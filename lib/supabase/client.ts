import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase environment variables are missing. Check .env.local (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  );
}

// "Remember Me" support: this flag itself always lives in localStorage (it
// has to survive browser restarts to be readable on the very next visit),
// and it decides which storage the actual session token is written to.
//   remembered (default)  -> localStorage   (session survives closing the browser)
//   not remembered        -> sessionStorage (session survives refresh, cleared when the tab/browser closes)
// Call setRememberMe() from the login form BEFORE calling signInWithPassword.
const REMEMBER_ME_KEY = "boq-auth-remember-me";

export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false");
}

function isRemembered(): boolean {
  if (typeof window === "undefined") return true;
  // Default to remembered so a fresh visitor's session still survives a
  // refresh even before they've ever seen the login form's checkbox.
  return window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";
}

const rememberAwareStorage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null;
    return (isRemembered() ? window.localStorage : window.sessionStorage).getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    (isRemembered() ? window.localStorage : window.sessionStorage).setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return;
    // Clear from both on sign-out, regardless of which one was active,
    // so no stale token is left behind either way.
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

// Not parameterized with generated Database types (none exist for this project yet).
// Run `supabase gen types typescript` against your project and pass the result here
// as createClient<Database>(...) for full column-level type safety.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: rememberAwareStorage,
  },
});
