import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** `overline` is the smaller uppercase label; `default` is a plain section label. */
  variant?: "default" | "overline";
  className?: string;
  children: ReactNode;
};

// A small muted heading above a section of content.
export function SectionHeading({ variant = "default", className, children }: SectionHeadingProps) {
  return (
    <span
      className={cn(
        "cube-rn-text",
        "font-semibold text-muted-foreground",
        variant === "overline" ? "text-xs uppercase tracking-wide" : "text-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
