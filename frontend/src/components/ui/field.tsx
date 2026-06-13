import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldProps = ComponentPropsWithoutRef<"div"> & {
  error?: ReactNode;
};

export function Field({ children, className, error, ...props }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

export function FieldLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn("block text-sm font-semibold leading-5 text-foreground", className)}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("text-sm leading-5 text-muted", className)} {...props} />;
}

export function FieldError({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn("text-sm font-medium leading-5 text-danger", className)}
      role="alert"
      {...props}
    />
  );
}

export function TextInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm",
        "text-foreground placeholder:text-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm",
        "text-foreground placeholder:text-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
