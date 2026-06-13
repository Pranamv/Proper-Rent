import type { Metadata } from "next";

import { absoluteUrl, site } from "@/lib/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function pageMetadata({ description, path, title }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url,
      siteName: site.name,
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
    },
  };
}
