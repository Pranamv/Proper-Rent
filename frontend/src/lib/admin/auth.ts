import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { adminApi, ApiError } from "@/lib/api";
import type { AdminAuthCheckResponse } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/utils/supabase/server";

export type AdminAuthState =
  | {
      status: "authenticated";
      accessToken: string;
      admin: AdminAuthCheckResponse;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "forbidden";
      email: string | null;
    }
  | {
      status: "misconfigured";
    }
  | {
      status: "backend_error";
    };

export const getAdminAuthState = cache(async (): Promise<AdminAuthState> => {
  if (!isSupabaseConfigured) {
    return { status: "misconfigured" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { status: "unauthenticated" };
  }

  try {
    return {
      status: "authenticated",
      accessToken: session.access_token,
      admin: await adminApi.checkAuth(session.access_token),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return { status: "unauthenticated" };
      }

      if (error.status === 403) {
        return {
          status: "forbidden",
          email: user.email ?? null,
        };
      }
    }

    return { status: "backend_error" };
  }
});
