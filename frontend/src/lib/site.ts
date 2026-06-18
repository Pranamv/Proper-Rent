import { publicConfig } from "@/lib/config";

export const site = {
  name: "Proper Rent",
  description:
    "Proper Rent helps tenants and landlords move from website interest to a letting agent.",
  contactEmail: "hello@properrent.co.uk",
  social: {
    whatsapp: "",
    facebook: "",
  },
  routes: {
    home: "/",
    tenants: "/tenants",
    landlords: "/landlords",
    howItWorks: "/how-it-works",
    about: "/about",
    blog: "/blog",
    contact: "/contact",
    privacy: "/privacy",
    terms: "/terms",
    renterRegister: "/register/renter",
    landlordRegister: "/register/landlord",
  },
} as const;

export const publicNavItems = [
  { href: site.routes.tenants, label: "Tenants" },
  { href: site.routes.landlords, label: "Landlords" },
  { href: site.routes.howItWorks, label: "How it works" },
] as const;

export const footerNavItems = [
  ...publicNavItems,
  { href: site.routes.privacy, label: "Privacy" },
  { href: site.routes.terms, label: "Terms" },
] as const;

export const footerCompanyItems = [
  { href: site.routes.about, label: "About Us" },
  { href: site.routes.blog, label: "Blog" },
  { href: site.routes.contact, label: "Contact Us" },
] as const;

export function absoluteUrl(path: string) {
  return `${publicConfig.siteUrl}${path}`;
}
