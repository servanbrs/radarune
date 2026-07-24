import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10",
        className,
      )}
      {...props}
    />
  );
}
