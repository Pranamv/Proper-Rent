import Script from "next/script";

import { publicConfig } from "@/lib/config";

const PLAUSIBLE_SCRIPT_SRC = "https://plausible.io/js/script.js";

export function CookielessAnalytics() {
  const analyticsDomain = publicConfig.analyticsDomain.trim();
  if (!isCookielessAnalyticsEnabled(analyticsDomain)) {
    return null;
  }

  return (
    <Script
      data-domain={analyticsDomain}
      id="plausible-analytics"
      src={PLAUSIBLE_SCRIPT_SRC}
      strategy="afterInteractive"
    />
  );
}

function isCookielessAnalyticsEnabled(analyticsDomain: string) {
  return process.env.NODE_ENV === "production" && analyticsDomain.length > 0;
}
