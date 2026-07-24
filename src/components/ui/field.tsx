import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
};

export function Field({ children, error, hint, htmlFor, label }: FieldProps) {
  return (
    <label className="flex flex-col gap-2" htmlFor={htmlFor}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      <span
        className={cn("min-h-5 text-xs", error ? "text-danger" : "text-muted")}
      >
        {error ?? hint ?? ""}
      </span>
    </label>
  );
}
