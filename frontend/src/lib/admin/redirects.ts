const ADMIN_HOME = "/admin";
const ADMIN_LOGIN = "/admin/login";

export function safeAdminRedirect(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith("/admin") || candidate.startsWith("//")) {
    return ADMIN_HOME;
  }

  if (candidate === ADMIN_LOGIN || candidate.startsWith(`${ADMIN_LOGIN}?`)) {
    return ADMIN_HOME;
  }

  return candidate;
}

export function adminLoginRedirect(redirectTo: string = ADMIN_HOME) {
  return `${ADMIN_LOGIN}?redirectTo=${encodeURIComponent(safeAdminRedirect(redirectTo))}`;
}
