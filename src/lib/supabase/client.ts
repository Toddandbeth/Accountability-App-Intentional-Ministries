import { createBrowserClient } from "@supabase/ssr";

// Not typed against a generated Database schema yet — there's no live
// Supabase project to codegen from. See src/lib/supabase/types.ts for the
// hand-written row shapes used to type component props in the meantime.
// Once a project exists, regenerate with `supabase gen types typescript`
// and pass it here as createBrowserClient<Database>(...).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
