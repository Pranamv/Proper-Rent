import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminMetaItemProps = {
  actions?: ReactNode;
  className?: string;
  label: string;
  value: ReactNode;
  valueKind?: "default" | "identifier" | "contact";
};

export function AdminMetaItem({
  actions,
  className,
  label,
  value,
  valueKind = "default",
}: AdminMetaItemProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-1 sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-x-4",
        className,
      )}
    >
      <dt className="text-muted sm:min-w-28">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground">
        <span
          className={cn(
            "block min-w-0",
            valueKind === "identifier" || valueKind === "contact"
              ? "break-all"
              : "break-words",
          )}
        >
          {value}
        </span>
        {actions ? <div className="mt-2">{actions}</div> : null}
      </dd>
    </div>
  );
}
