"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/features/authentication/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full whitespace-nowrap"
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