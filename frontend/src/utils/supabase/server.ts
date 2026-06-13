import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isSupabaseConfigured, publicConfig } from "@/lib/config";

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase server client is not configured");
  }

  return createServerClient(
    publicConfig.supabase.url,
    publicConfig.supabase.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because the
            // middleware (src/middleware.ts) refreshes the session.
          }
        },
      },
    },
  );
};
