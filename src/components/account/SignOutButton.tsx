"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/account/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
