import "server-only";

import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
import { cache } from "react";

import { adminApi, ApiError } from "@/lib/api";
import type { AdminAuthCheckResponse } from "@/lib/api";
import type { AdminRole } from "@/lib/admin/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/utils/supabase/server";

export type AdminSessionUser = {
  email: string;
  role: AdminRole;
};

export type AdminSessionState =
  | {
      status: "authenticated";
      accessToken: string;
      admin: AdminSessionUser;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "misconfigured";
    };

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

export const getAdminSessionState = cache(async (): Promise<AdminSessionState> => {
  if (!isSupabaseConfigured) {
    return { status: "misconfigured" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { status: "unauthenticated" };
  }

  return {
    status: "authenticated",
    accessToken: session.access_token,
    admin: {
      email: emailFromAccessToken(session.access_token) ?? "Signed-in admin",
      role: "admin",
    },
  };
});

export const getAdminAuthState = cache(async (): Promise<AdminAuthState> => {
  const sessionState = await getAdminSessionState();

  if (sessionState.status !== "authenticated") {
    return sessionState;
  }

  // Callers that need a definitive admin check can still ask the backend.
  // Data pages skip this and rely on their actual admin API request instead.
  try {
    return {
      status: "authenticated",
      accessToken: sessionState.accessToken,
      admin: await adminApi.checkAuth(sessionState.accessToken),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return { status: "unauthenticated" };
      }

      if (error.status === 403) {
        return {
          status: "forbidden",
          email: sessionState.admin.email,
        };
      }
    }

    return { status: "backend_error" };
  }
});

function emailFromAccessToken(accessToken: string) {
  const [, payload] = accessToken.split(".");
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    return typeof claims.email === "string" && claims.email.trim()
      ? claims.email.trim()
      : null;
  } catch {
    return null;
  }
}
