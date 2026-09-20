import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

/**
 * `shape` is derived from whether a label was passed, not taken as a prop —
 * a dot is what a badge with nothing to say already is, and making it a second
 * axis would allow the two states that mean nothing: a dot with a label it
 * cannot show, and an empty pill.
 */
const badgeVariants = cva("shrink-0 self-start rounded-full border border-transparent", {
  variants: {
    variant: {
      default: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "border-border bg-transparent",
      success: "bg-green-700",
      warning: "bg-amber-700",
    },
    shape: {
      pill: "flex-row items-center justify-center gap-1 px-2 py-0.5",
      dot: "h-2 w-2",
    },
  },
  defaultVariants: { variant: "default", shape: "pill" },
});

const badgeTextVariants = cva("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-white",
      outline: "text-foreground",
      success: "text-white",
      warning: "text-white",
    },
  },
  defaultVariants: { variant: "default" },
});

type BadgeProps = {
  variant?: BadgeVariant;
  /**
   * Overrides the variant's background with a literal colour — for a badge
   * standing in for a user-chosen tag or category. Passing it also drops the
   * variant's label colour, since the caller's background is unknown and
   * `text-primary-foreground` would be a guess. Pair it with `readableTextColor`
   * when the label has to stay legible on an arbitrary hue.
   */
  backgroundColor?: string | undefined;
  className?: string | undefined;
  /**
   * What the dot stands for, exposed as its accessible name. Ignored in the
   * pill form, where the label is already the name.
   */
  label?: string | undefined;
  /** Absent — including an empty string — collapses the badge to a dot. */
  children?: string | undefined;
};

export function Badge({
  variant = "default",
  backgroundColor,
  className,
  label,
  children,
}: BadgeProps) {
  const shape = children ? "pill" : "dot";

  return (
    <div
      className={cn("cube-rn-view", badgeVariants({ variant, shape }), className)}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
      // A dot carries meaning and no text, so it is named or it is decoration;
      // the same split `color-dot` makes, for the same reason.
      {...(shape === "dot"
        ? label
          ? ({ role: "img", "aria-label": label } as const)
          : ({ "aria-hidden": true } as const)
        : {})}
    >
      {children ? (
        <span
          className={cn(
            "cube-rn-text",
            backgroundColor
              ? "text-xs font-medium text-foreground"
              : badgeTextVariants({ variant }),
          )}
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}
