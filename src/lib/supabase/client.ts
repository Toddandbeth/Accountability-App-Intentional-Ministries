import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Not typed against a generated Database schema yet — there's no live
// Supabase project to codegen from. See src/lib/supabase/types.ts for the
// hand-written row shapes used to type component props in the meantime.
// Once a project exists, regenerate with `supabase gen types typescript`
// and pass it here as createBrowserClient<Database>(...).

// Module-level singleton, not a fresh client per call. Every GoTrueClient
// instance independently runs its own detectSessionInUrl pass on
// construction, which reads AND clears the URL's auth hash — a second
// instance created moments after the first (e.g. React Strict Mode's
// double-invoke in dev, or any component calling this more than once)
// would find the hash already consumed and silently miss the session,
// so anything relying on onAuthStateChange right after a confirmation or
// recovery link (see src/app/login/page.tsx, reset-password/page.tsx)
// needs every caller sharing the exact same client instance.
let client: SupabaseClient | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
