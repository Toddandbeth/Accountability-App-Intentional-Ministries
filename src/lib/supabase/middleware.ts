import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];
// Never force-redirected either direction: /forgot-password is fine to see
// whether or not you're logged in, and /reset-password's whole point is a
// user who is (via the recovery link) authenticated but needs to set a new
// password before doing anything else — bouncing them to /checkin first
// would break the flow. The recovery session itself is also often only
// established client-side (PKCE code exchange) after this middleware has
// already run, so there's no reliable server-side auth state to gate on
// here anyway.
// /font-preview is a TEMPORARY dev-only page (see src/app/font-preview) for
// viewing candidate type sizes on a phone via the local dev server without
// needing to log in there separately. Remove this line when that route is
// deleted.
const ALWAYS_ACCESSIBLE_PATHS = ["/forgot-password", "/reset-password", "/font-preview"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session cookie if needed — do not remove.
  // Fails closed (treated as logged out) if Supabase is unreachable.
  let user = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch {
    user = null;
  }

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isAlwaysAccessible = ALWAYS_ACCESSIBLE_PATHS.some((p) => path.startsWith(p));

  if (isAlwaysAccessible) {
    return response;
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/checkin";
    return NextResponse.redirect(url);
  }

  return response;
}
