import Link from "next/link";

import { publicConfig } from "@/lib/config";

const foundationItems = [
  {
    title: "Public Website",
    body: "Next.js app shell ready for renter, landlord, process, privacy, and terms pages.",
  },
  {
    title: "Backend API",
    body: "FastAPI service mounted at /api/v1 with a health contract and environment validation.",
  },
  {
    title: "Phase Boundaries",
    body: "No listing routes, Scraye sync, social channels, RAG, or commission tracker in this phase.",
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
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" href="/" aria-label="Proper Rent home">
            <span className="brand__mark" aria-hidden="true">
              PR
            </span>
            <span>Proper Rent</span>
          </Link>
          <span className="status-pill">Phase 1 foundation</span>
        </div>
      </header>

      <main className="page">
        <section className="hero" aria-labelledby="home-title">
          <div className="hero__content">
            <p className="eyebrow">Website + Chatbot MVP</p>
            <h1 id="home-title">Proper Rent</h1>
            <p className="hero__copy">
              A focused foundation for renter and landlord intake, a general
              fintech/process chatbot, and the future admin workflow that routes every
              website lead to a human agent.
            </p>
            <a className="health-link" href={`${publicConfig.apiBaseUrl}/health`}>
              API health
            </a>
          </div>

          <div className="foundation-panel" aria-label="Foundation workstreams">
            {foundationItems.map((item) => (
              <article className="foundation-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="meta-grid" aria-label="Runtime configuration">
          {metaItems.map((item) => (
            <div className="meta-item" key={item.label}>
              <span>{item.label}</span>
              <p>{item.value}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
