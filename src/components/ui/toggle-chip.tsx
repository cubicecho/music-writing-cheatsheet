import * as React from "react";
import { cn } from "@/lib/utils";

export type ToggleChipProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "className" | "style"
> & {
  selected?: boolean | undefined;
  /**
   * Overrides the selected background with a literal colour — for a chip whose
   * own colour is the content, such as a palette swatch. Passing it also turns
   * off the selected label colour, since the caller's background is unknown and
   * `text-primary-foreground` would be a guess. Pair it with
   * `readableTextColor` if the label has to stay legible on an arbitrary hue.
   */
  backgroundColor?: string | undefined;
  size?: "sm" | "default" | undefined;
  // Re-declared rather than inherited, for the reason `button.tsx` gives:
  // nativewind types it as `className?: string`, which under
  // `exactOptionalPropertyTypes` rejects the `cond ? "x" : undefined` that call
  // sites pass.
  className?: string | undefined;
  children: React.ReactNode;
};

const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  (
    {
      selected = false,
      disabled = false,
      backgroundColor,
      size = "default",
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabled}
      // The same two facts in the spelling the web understands. react-native-web does not read
      // `accessibilityState` — it forwards an allowlist of `aria-*` props and nothing else — so
      // without these the chip is styled but silent to a screen reader. `aria-pressed` and not
      // `aria-selected` because this is a `button`, where `aria-selected` is markup axe rejects.
      aria-pressed={selected}
      aria-disabled={disabled ?? false}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        "rounded-md border",
        size === "sm" ? "px-2 py-1" : "px-3 py-2",
        selected ? "border-primary bg-primary" : "border-border bg-background hover:bg-muted",
        // The label colour on the container as well as on the `<Text>` below,
        // and that is not a duplicate. The `<Text>` is the only one native
        // reads, and it is only ever reached by a bare string; an element
        // child — an icon, a `<Badge>`, anything with its own markup — passes
        // through untouched and on web takes its colour by inheriting from
        // here. Without this line a selected chip holding markup drew
        // `text-foreground` on `bg-primary`, which is near-black on near-black.
        selected && !backgroundColor ? "text-primary-foreground" : "text-foreground",
        disabled && "opacity-60",
        className,
      )}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
      {...(props as React.ComponentPropsWithoutRef<"button">)}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <span
          className={cn(
            "cube-rn-text",
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm",
            selected && !backgroundColor ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  ),
);
ToggleChip.displayName = "ToggleChip";

export { ToggleChip };
