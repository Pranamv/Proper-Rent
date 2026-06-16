import Image from "next/image";

const processHighlights = [
  {
    label: "Register details",
    value: "2 min",
  },
  {
    label: "Target follow-up",
    value: "24h",
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
        </div>
        <div className="grid gap-2.5 border-t border-border bg-surface p-3 sm:grid-cols-2">
          {processHighlights.map((item) => (
            <div className="rounded-md bg-surface-elevated px-3 py-2.5" key={item.label}>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold leading-none text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
