import { PiggyBank, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

const supportHighlights = [
  {
    label: "Deposit Share",
    value: "Up to 85%",
    body: "deposit covered on day one",
  },
  {
    label: "Guarantor support",
    value: "UK options",
    body: "for renters without a traditional guarantor",
  },
] as const;

export function HeroSupportPanel() {
  return (
    <aside className="w-full min-w-0 max-w-xl" aria-label="Proper Rent support preview">
      <div className="overflow-hidden rounded-md border border-border bg-surface shadow-soft">
        <div className="relative aspect-[16/11] min-h-[310px]">
          <Image
            src="/images/home-hero-rental-interior.webp"
            alt="Bright modern rental home interior with natural light and neutral furnishings"
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/10 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/95 px-3 py-2 text-xs font-bold text-foreground shadow-soft backdrop-blur">
              <PiggyBank size={16} weight="bold" aria-hidden="true" />
              Up to 85% deposit support
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/95 px-3 py-2 text-xs font-bold text-foreground shadow-soft backdrop-blur">
              <ShieldCheck size={16} weight="bold" aria-hidden="true" />
              Guarantor options
            </span>
          </div>
        </div>
        <div className="grid gap-3 border-t border-border bg-surface p-4 sm:grid-cols-2">
          {supportHighlights.map((item) => (
            <div className="rounded-md bg-surface-elevated p-4" key={item.label}>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
