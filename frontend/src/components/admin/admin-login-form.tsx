"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { adminApi, ApiError } from "@/lib/api";
import { safeAdminRedirect } from "@/lib/admin/redirects";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldHint, FieldLabel, TextInput } from "@/components/ui/field";

type AdminLoginFormProps = {
  redirectTo: string;
};

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Supabase auth is not configured for this environment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !session?.access_token) {
        setError("Email or password was not recognised.");
        return;
      }

      await adminApi.checkAuth(session.access_token);
      router.replace(safeAdminRedirect(redirectTo));
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 403) {
        setError("This Supabase user is not mapped to an admin agent.");
        try {
          await createClient().auth.signOut();
        } catch {
          // Keep the user on this screen; the protected layout will also block access.
        }
        return;
      }

      setError("Admin access could not be verified. Check the backend and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Admin login
        </p>
        <CardTitle>Sign in to the workspace.</CardTitle>
        <CardDescription>
          Use the admin account assigned to Proper Rent operations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="admin-email">Email</FieldLabel>
            <TextInput
              autoComplete="email"
              disabled={isSubmitting || !isSupabaseConfigured}
              id="admin-email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="admin-password">Password</FieldLabel>
            <div className="flex gap-2">
              <TextInput
                autoComplete="current-password"
                className="min-w-0"
                disabled={isSubmitting || !isSupabaseConfigured}
                id="admin-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-controls="admin-password"
                aria-pressed={showPassword}
                className="h-11 shrink-0 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-muted hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={isSubmitting || !isSupabaseConfigured}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <FieldHint>Admin access is invite-only.</FieldHint>
          </Field>

          {error ? (
            <div
              className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {!isSupabaseConfigured ? (
            <div
              className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning"
              role="status"
            >
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
              enable admin login.
            </div>
          ) : null}

          <Button
            className="w-full"
            disabled={isSubmitting || !isSupabaseConfigured}
            type="submit"
          >
            {isSubmitting ? "Checking access..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
