import { Bank, CalendarCheck, HouseLine, UserCheck } from "@phosphor-icons/react/dist/ssr";

const heroMetrics = [
  {
    label: "Upfront rent",
    value: "Lump sum",
  },
  {
    label: "Tenant payments",
    value: "Monthly",
  },
] as const;

export function LandlordHeroPanel() {
  return (
    <aside className="w-full min-w-0 max-w-xl" aria-label="Advanced Rent preview">
      <div className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Bank size={24} weight="bold" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
              Advanced Rent
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-foreground">
              Turn future rent into upfront cash.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Proper Rent checks whether your property fits, then talks through
              the numbers with you directly.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {heroMetrics.map((metric) => (
            <div
              className="rounded-md bg-surface-elevated p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-accent-linen motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              key={metric.label}
            >
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 hidden gap-3 border-t border-border pt-5 sm:grid">
          {[
            {
              icon: CalendarCheck,
              text: "Tenants keep paying on their normal monthly schedule.",
            },
            {
              icon: UserCheck,
              text: "A Proper Rent agent confirms fit before anything moves forward.",
            },
            {
              icon: HouseLine,
              text: "You can also discuss listing a property through the same route.",
            },
          ].map((item) => (
            <div className="flex items-start gap-3" key={item.text}>
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-accent-linen text-foreground">
                <item.icon size={17} weight="bold" aria-hidden="true" />
              </span>
              <p className="text-sm leading-6 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
