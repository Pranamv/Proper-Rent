"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavItem } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

type AdminNavProps = {
  compact?: boolean;
  items: AdminNavItem[];
};

export function AdminNav({ compact = false, items }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      <ul className={cn(compact ? "grid grid-cols-2 gap-2" : "grid gap-2")}>
        {items.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.label}: ${item.description}`}
                className={cn(
                  "block min-w-0 rounded-md border border-transparent px-3 py-2.5 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  compact && "h-full py-2 text-center",
                  isActive
                    ? "border-primary bg-accent text-accent-foreground"
                    : "text-muted hover:bg-surface-subtle hover:text-foreground",
                )}
                href={item.href}
              >
                <span className="block truncate font-semibold">{item.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-5 text-muted",
                    compact && "sr-only",
                  )}
                >
                  {item.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
