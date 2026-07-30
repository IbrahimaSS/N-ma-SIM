import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline";
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs md:text-sm font-semibold transition-colors",
          {
            "bg-primary/10 text-primary": variant === "default",
            "bg-success/15 text-success": variant === "success",
            "bg-warning/15 text-warning": variant === "warning", // Orange d'attente
            "bg-error/15 text-error": variant === "error",
            "border border-border-light text-text-muted bg-white": variant === "outline",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
