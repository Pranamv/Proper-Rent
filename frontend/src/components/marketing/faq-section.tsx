import { Section } from "@/components/marketing/section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/site";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  items: FaqItem[];
  pagePath: string;
  title?: string;
  body?: string;
};

export function FaqSection({
  body = "Short answers to the questions visitors are most likely to ask before registering.",
  items,
  pagePath,
  title = "FAQ",
}: FaqSectionProps) {
  return (
    <Section body={body} title={title}>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card className="shadow-none" key={item.question}>
            <CardHeader>
              <CardTitle as="h3">{item.question}</CardTitle>
              <CardDescription>{item.answer}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(items, pagePath)),
        }}
      />
    </Section>
  );
}

function buildFaqJsonLd(items: FaqItem[], pagePath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: absoluteUrl(pagePath),
  };
}
