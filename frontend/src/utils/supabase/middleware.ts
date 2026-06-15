import { type NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured, publicConfig } from "@/lib/config";

export const updateSession = async (request: NextRequest) => {
  const response = NextResponse.next({ request });

  // If Supabase isn't configured (e.g. a build without .env.local), skip the
  // refresh rather than throwing and 500-ing the request.
  if (!isSupabaseConfigured) {
    return response;
  }

  if (!hasSupabaseSessionCookie(request) && request.nextUrl.pathname !== "/admin/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "redirectTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  return response;
};

function hasSupabaseSessionCookie(request: NextRequest) {
  const projectRef = supabaseProjectRef(publicConfig.supabase.url);
  const expectedPrefix = projectRef ? `sb-${projectRef}-auth-token` : "sb-";

  return request.cookies.getAll().some(({ name }) => {
    if (projectRef) {
      return name === expectedPrefix || name.startsWith(`${expectedPrefix}.`);
    }

    return /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
  });
}

function supabaseProjectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}
