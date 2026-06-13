import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "warning";

type StatusPillProps = ComponentPropsWithoutRef<"span"> & {
  tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-border bg-surface text-muted",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

export function StatusPill({
  className,
  tone = "neutral",
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
