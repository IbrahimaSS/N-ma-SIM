import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: number;
  label: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  return (
    <div className={cn("flex items-center justify-between w-full relative", className)}>
      {/* Ligne de progression (fond) */}
      <div className="absolute top-4 left-0 right-0 h-[2px] bg-border-light z-0 hidden md:block"></div>
      
      {steps.map((step) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 px-2 bg-bg-light">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                {
                  "bg-primary border-primary text-white": isCompleted,
                  "bg-accent border-accent text-primary": isActive, // Jaune quand actif
                  "bg-white border-border-light text-text-muted": !isCompleted && !isActive,
                }
              )}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : step.id}
            </div>
            <span
              className={cn("text-xs md:text-sm font-semibold hidden md:block", {
                "text-primary": isCompleted || isActive,
                "text-text-muted": !isCompleted && !isActive,
              })}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
