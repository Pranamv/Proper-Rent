export type AdminRole = "admin" | "agent";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  roles: AdminRole[];
};

const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    description: "Daily operating snapshot",
    roles: ["admin"],
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Renter pipeline",
    roles: ["admin"],
  },
  {
    href: "/admin/landlords",
    label: "Landlords",
    description: "Property-owner pipeline",
    roles: ["admin"],
  },
];

export function getAdminNavItems(role: AdminRole) {
  return adminNavItems.filter((item) => item.roles.includes(role));
}
