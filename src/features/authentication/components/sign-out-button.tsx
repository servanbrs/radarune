"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/features/authentication/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string } = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className={cn("w-full whitespace-nowrap", className)}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await authClient.signOut();

          router.replace("/sign-in");
          router.refresh();
        });
      }}
      variant="secondary"
    >
      {isPending ? "Çıkış yapılıyor..." : "Çıkış yap"}
    </Button>
  );
}
