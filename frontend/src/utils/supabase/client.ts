import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured, publicConfig } from "@/lib/config";

export const createClient = () => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase browser client is not configured");
  }

  return createBrowserClient(
    publicConfig.supabase.url,
    publicConfig.supabase.publishableKey,
  );
};
