const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";
const DEFAULT_SITE_URL = "http://localhost:3000";

export const publicConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  analyticsDomain: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN ?? "",
  analyticsSiteId: process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID ?? "",
} as const;

