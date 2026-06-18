import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { publicConfig } from "@/lib/config";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.siteUrl),
  title: {
    default: "Proper Rent",
    template: "%s | Proper Rent",
  },
  description:
    "Proper Rent helps tenants and landlords move from website interest to a letting agent.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Proper Rent",
    description:
      "Renter and landlord intake, a letting-process chatbot, and human agent follow-up.",
    url: publicConfig.siteUrl,
    siteName: "Proper Rent",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={plusJakartaSans.variable} lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
