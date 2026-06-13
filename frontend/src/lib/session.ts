export const PUBLIC_SESSION_STORAGE_KEY = "proper-rent-session-id";

export function resolvePublicSessionId(params?: URLSearchParams): string {
  const querySessionId = params?.get("session_id")?.slice(0, 128);
  if (querySessionId) {
    persistPublicSessionId(querySessionId);
    return querySessionId;
  }

  const storedSessionId = readPublicSessionId();
  if (storedSessionId) {
    return storedSessionId;
  }

  const nextSessionId = createPublicSessionId();
  persistPublicSessionId(nextSessionId);
  return nextSessionId;
}

export function readPublicSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(PUBLIC_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistPublicSessionId(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PUBLIC_SESSION_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in private browsing. The in-memory state still works.
  }
}

export function createPublicSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
