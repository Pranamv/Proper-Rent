import type { Metadata } from "next";
import type { ReactNode } from "react";

import { publicConfig } from "@/lib/config";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.siteUrl),
  title: {
    default: "Proper Rent",
    template: "%s | Proper Rent",
  },
  description:
    "Proper Rent helps renters and landlords move from website interest to a human letting agent.",
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
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
