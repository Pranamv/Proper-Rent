import type { ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroAction = {
  className?: string;
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  actions?: HeroAction[];
  aside?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
};

export function PageHero({
  actions = [],
  aside,
  body,
  className,
  eyebrow,
  eyebrowClassName,
  title,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "grid items-center gap-9 py-10 sm:py-14 lg:grid-cols-[1.06fr_0.94fr]",
        className,
      )}
      aria-labelledby="page-title"
    >
      <div className="min-w-0">
        <p
          className={cn(
            "mb-4 text-sm font-bold uppercase tracking-[0.08em] text-primary",
            eyebrowClassName,
          )}
        >
          {eyebrow}
        </p>
        <h1
          id="page-title"
          className="max-w-4xl text-4xl font-bold leading-[1.04] text-foreground sm:text-6xl sm:leading-[1.02]"
        >
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{body}</p>
        {actions.length ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <a
                className={buttonClasses({
                  className: cn(
                    "max-[420px]:h-11 max-[420px]:px-4 max-[420px]:text-sm",
                    action.className,
                  ),
                  variant: action.variant ?? "primary",
                  size: "lg",
                })}
                href={action.href}
                key={action.label}
              >
                {action.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </section>
  );
}
