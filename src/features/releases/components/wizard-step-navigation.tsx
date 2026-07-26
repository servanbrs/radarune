import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
};

export function WizardStepNavigation({
  currentStep,
  steps,
  onSelect,
}: {
  currentStep: string;
  steps: WizardStep[];
  onSelect: (step: string) => void;
}) {
  return (
    <nav className="grid gap-2 md:grid-cols-4">
      {steps.map((step, index) => (
        <button
          className={cn(
            "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
            currentStep === step.id
              ? "border-accent bg-accent text-accent-foreground"
              : "border-line bg-white text-muted hover:border-accent/40 hover:text-foreground",
          )}
          key={step.id}
          onClick={() => onSelect(step.id)}
          type="button"
        >
          <span className="block text-xs opacity-70">Adım {index + 1}</span>
          {step.title}
        </button>
      ))}
    </nav>
  );
}
