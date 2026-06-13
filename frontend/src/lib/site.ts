import { publicConfig } from "@/lib/config";

export const site = {
  name: "Proper Rent",
  description:
    "Proper Rent helps renters and landlords move from website interest to a human letting agent.",
  routes: {
    home: "/",
    renters: "/renters",
    landlords: "/landlords",
    howItWorks: "/how-it-works",
    privacy: "/privacy",
    terms: "/terms",
    renterRegister: "/register/renter",
    landlordRegister: "/register/landlord",
  },
} as const;

export const publicNavItems = [
  { href: site.routes.renters, label: "Renters" },
  { href: site.routes.landlords, label: "Landlords" },
  { href: site.routes.howItWorks, label: "How it works" },
] as const;

export const footerNavItems = [
  ...publicNavItems,
  { href: site.routes.privacy, label: "Privacy" },
  { href: site.routes.terms, label: "Terms" },
] as const;

export function absoluteUrl(path: string) {
  return `${publicConfig.siteUrl}${path}`;
}
