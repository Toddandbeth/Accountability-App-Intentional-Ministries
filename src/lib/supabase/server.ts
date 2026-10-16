import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// See the note in src/lib/supabase/client.ts — not typed against a
// generated Database schema yet.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component during render, where
            // cookies can't be mutated. Safe to ignore — middleware.ts
            // refreshes the session on every request instead.
          }
        },
      },
    }
  );
}

// Identifies the signed-in user from the session JWT, verified locally
// against Supabase's cached signing keys — no network round trip to
// Supabase Auth (unlike auth.getUser()). The Proxy has already refreshed
// the session for this request; row-level security still enforces access
// on every query. Returns null when there is no valid session.
export async function getCurrentUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string; email: string | null } | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
}
