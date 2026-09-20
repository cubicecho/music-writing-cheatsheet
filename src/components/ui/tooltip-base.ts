import type { ReactNode } from "react";

export type TooltipProviderProps = { children: ReactNode };

export type TooltipProps = { children: ReactNode };

export type TooltipTriggerProps = {
  /** Hand the handlers to the single child rather than wrapping it. */
  asChild?: boolean | undefined;
  children: ReactNode;
};

export type TooltipContentProps = {
  className?: string | undefined;
  children: ReactNode;
};

export const TOOLTIP_CONTENT_CLASS = "overflow-hidden rounded-md border bg-popover px-3 py-1.5";
export const TOOLTIP_TEXT_CLASS = "text-sm text-popover-foreground";
