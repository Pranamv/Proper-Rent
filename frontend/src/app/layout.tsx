import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Proper Rent",
  description: "Phase 1 foundation for the Proper Rent website and chatbot MVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}

