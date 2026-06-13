import { buttonClasses } from "@/components/ui/button";

type CtaBandProps = {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CtaBand({
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  title,
}: CtaBandProps) {
  return (
    <section className="my-10 rounded-md border border-border bg-primary p-6 text-primary-foreground sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold leading-tight">{title}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-primary-foreground/85">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            className={buttonClasses({
              className: "bg-surface text-foreground hover:bg-surface-subtle",
              size: "lg",
            })}
            href={primaryHref}
          >
            {primaryLabel}
          </a>
          {secondaryHref && secondaryLabel ? (
            <a
              className={buttonClasses({
                className:
                  "border-primary-foreground/35 bg-primary text-primary-foreground hover:bg-primary/90",
                size: "lg",
                variant: "secondary",
              })}
              href={secondaryHref}
            >
              {secondaryLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
