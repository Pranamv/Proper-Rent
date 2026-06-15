import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured, publicConfig } from "@/lib/config";

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase isn't configured (e.g. a build without .env.local), skip the
  // refresh rather than throwing and 500-ing the request.
  if (!isSupabaseConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    publicConfig.supabase.url,
    publicConfig.supabase.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Keep middleware lightweight. The protected admin layout and backend API
  // validate the access token; middleware only checks whether a session cookie
  // exists so unauthenticated visitors can be redirected early.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token && request.nextUrl.pathname !== "/admin/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "redirectTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
};
