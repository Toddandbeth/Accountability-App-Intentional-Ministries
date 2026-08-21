import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // /api/* is excluded: those routes have no browser session to check
    // (e.g. the cron endpoint in vercel.json, invoked with no cookies at
    // all) and handle their own auth individually.
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
