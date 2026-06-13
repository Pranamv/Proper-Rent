import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only authenticated areas need session refresh in Phase 1. Public marketing
  // pages don't use Supabase, so keep the Supabase round-trip (and any missing
  // config) off the critical path. Expand this when the renter dashboard lands.
  matcher: ["/admin/:path*"],
};
