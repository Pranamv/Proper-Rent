"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function AdminSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      disabled={isSigningOut}
      onClick={handleSignOut}
      size="sm"
      type="button"
      variant="secondary"
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
