import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
};

export function WizardStepNavigation({
  currentStep,
  maxAccessibleIndex,
  steps,
  onSelect,
}: {
  currentStep: string;
  maxAccessibleIndex: number;
  steps: WizardStep[];
  onSelect: (step: string) => void;
}) {
  return (
    <nav
      aria-label="Yayın oluşturma adımları"
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6"
    >
      {steps.map((step, index) => {
        const active = currentStep === step.id;
        const completed = index < maxAccessibleIndex;
        const accessible = index <= maxAccessibleIndex;

        return (
          <button
            aria-current={active ? "step" : undefined}
            className={cn(
              "min-w-0 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
              active
                ? "border-accent bg-accent text-accent-foreground"
                : completed
                  ? "border-accent/30 bg-accent/5 text-foreground"
                  : "border-line bg-white text-muted",
              accessible
                ? "hover:border-accent/50 hover:text-foreground"
                : "cursor-not-allowed opacity-55",
            )}
            disabled={!accessible}
            key={step.id}
            onClick={() => onSelect(step.id)}
            type="button"
          >
            <span className="flex items-center gap-2 text-xs opacity-75">
              {completed ? <Check className="size-3.5" /> : null}
              Adım {index + 1}
            </span>
            <span className="mt-1 block truncate">{step.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
