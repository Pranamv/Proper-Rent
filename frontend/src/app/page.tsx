import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicConfig } from "@/lib/config";
import { motionClasses } from "@/lib/motion";

const foundationItems = [
  {
    title: "Layout System",
    body: "Shared shell, container, metadata, focus states, and reduced-motion defaults are ready for public and admin surfaces.",
  },
  {
    title: "Design Tokens",
    body: "Tailwind consumes one CSS-variable token set for colour, type, radii, spacing, shadows, and motion.",
  },
  {
    title: "API Patterns",
    body: "Typed client helpers cover health, chat, renter intake, and landlord intake without exposing backend internals.",
  },
];

const metaItems = [
  {
    label: "Backend",
    value: publicConfig.apiBaseUrl,
  },
  {
    label: "Frontend",
    value: publicConfig.siteUrl,
  },
  {
    label: "Analytics",
    value: publicConfig.analyticsDomain || "Disabled locally",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <Container className="py-10 sm:py-14">
        <section
          className="grid items-stretch gap-9 lg:grid-cols-[1.08fr_0.92fr]"
          aria-labelledby="home-title"
        >
          <div
            className={`flex min-h-[360px] flex-col justify-center ${motionClasses.enter}`}
          >
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-primary">
              Website + Chatbot MVP
            </p>
            <h1
              id="home-title"
              className="max-w-3xl text-5xl font-bold leading-[0.98] text-foreground sm:text-6xl"
            >
              Proper Rent
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              A focused frontend foundation for renter and landlord intake, a
              general fintech/process chatbot, and the future admin workflow that
              routes every website lead to a human agent.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className={buttonClasses({ size: "lg" })}
                href={`${publicConfig.apiBaseUrl}/health`}
              >
                API health
              </a>
              <a className={buttonClasses({ variant: "secondary", size: "lg" })} href="#runtime">
                Runtime config
              </a>
            </div>
          </div>

          <div
            className="grid content-center gap-4 rounded-md border border-border bg-surface/80 p-4 shadow-soft"
            aria-label="Foundation workstreams"
          >
            {foundationItems.map((item) => (
              <Card className="shadow-none" key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="runtime"
          className="mt-8 grid gap-4 sm:grid-cols-3"
          aria-label="Runtime configuration"
        >
          {metaItems.map((item) => (
            <div
              className="rounded-md border border-border bg-surface/75 p-4"
              key={item.label}
            >
              <span className="block text-sm font-bold text-primary">{item.label}</span>
              <p className="mt-2 break-words text-sm leading-6 text-muted">{item.value}</p>
            </div>
          ))}
        </section>
      </Container>
    </SiteShell>
  );
}
