import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-medium whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-accent bg-accent px-5 py-3 text-accent-foreground shadow-[0_10px_30px_rgba(15,118,110,0.22)] hover:-translate-y-0.5 hover:bg-accent/90",
        secondary:
          "border-line bg-surface px-5 py-3 text-foreground hover:bg-surface-strong",
        ghost:
          "border-transparent bg-transparent px-3 py-2 text-muted hover:border-line hover:bg-surface",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  size,
  variant,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      type={type}
      {...props}
    />
  );
}
