import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

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

export const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  function TextInput({ className, ...props }, ref) {
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
        ref={ref}
        {...props}
      />
    );
  },
);

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

export function SelectInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-10 text-sm",
          "text-foreground shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <CaretDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        weight="bold"
      />
    </span>
  );
}

export function CheckboxInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "size-4 rounded border-border bg-surface text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
      type="checkbox"
    />
  );
}
