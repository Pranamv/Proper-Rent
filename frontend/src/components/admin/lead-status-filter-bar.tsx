"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeadStatusFilter = {
  count: string;
  href: string;
  isActive: boolean;
  label: string;
};

type LeadStatusFilterBarProps = {
  filters: LeadStatusFilter[];
};

export function LeadStatusFilterBar({ filters }: LeadStatusFilterBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const searchSignature = searchParams.toString();

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, searchSignature]);

  return (
    <div className="min-w-0" aria-label="Lead status filters">
      <div className="flex flex-wrap gap-1.5" role="list">
        {filters.map((filter) => (
          <div key={filter.href} role="listitem">
            <Link
              aria-current={filter.isActive ? "page" : undefined}
              aria-label={`${filter.label}: ${filter.count} leads`}
              className={cn(
                buttonClasses({
                  className: "h-8 gap-1.5 px-2.5 text-xs",
                  size: "sm",
                  variant: filter.isActive ? "primary" : "secondary",
                }),
                pendingHref === filter.href && "opacity-70",
              )}
              href={filter.href}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  filter.isActive
                ) {
                  return;
                }
                setPendingHref(filter.href);
              }}
              prefetch={false}
            >
              <span>{filter.label}</span>
              <span className="text-[11px] opacity-75">{filter.count}</span>
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-1 min-h-4">
        {pendingHref ? (
          <p className="text-xs font-medium text-muted" role="status">
            Loading filtered leads...
          </p>
        ) : null}
      </div>
    </div>
  );
}
