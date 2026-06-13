import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  eyebrow?: string;
  title: string;
  body?: string;
  children: ReactNode;
};

export function Section({
  body,
  children,
  className,
  eyebrow,
  title,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-10 sm:py-12", className)} {...props}>
      <div className="mb-8 max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {body ? <p className="mt-4 text-base leading-7 text-muted">{body}</p> : null}
      </div>
      {children}
    </section>
  );
}
