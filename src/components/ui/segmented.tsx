import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The container class, for a pill the caller renders itself.
 *
 * `hover:` and `transition-colors` are no-ops on device and real on web, which
 * is the intended asymmetry: a pointer exists on one platform and not the other.
 */
export function segmentedItemClass(active: boolean, className?: string) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    className,
  );
}

/**
 * The `<Text>` half of the pill. Native does not inherit colour, so a pill
 * built from a `Pressable` needs the colour on its label, not on its container.
 * A pill built from a router `<Link>` does not need this — a link renders a
 * `Text` and text-in-text does inherit.
 */
export function segmentedTextClass(active: boolean, className?: string) {
  return cn(
    "text-sm font-medium",
    active ? "text-primary-foreground" : "text-muted-foreground",
    className,
  );
}

/**
 * A pressable pill.
 *
 * `children` is passed through untouched unless it is a bare string, in which
 * case it is wrapped in a `<Text>` carrying the active colour — the common case,
 * and the one where forgetting the wrapper is a runtime error on native.
 */
export function SegmentedButton({
  active,
  onClick: onPress,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      // The same fact again, in the only spelling the web understands.
      //
      // react-native-web does not read `accessibilityState` at all — it forwards an allowlist of
      // `aria-*` props and nothing else — so without this line the active pill is styled but
      // silent, and a screen reader user cannot tell which of the set is current. It is
      // `aria-pressed` rather than `aria-selected` because this is a `button`, and `aria-selected`
      // is only defined on `option`, `tab`, `row`, `gridcell` and `treeitem`; on a button it is
      // markup axe rejects. React Native has no `aria-pressed`, hence the platform guard.
      aria-pressed={active}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        "rounded-md px-3 py-1.5",
        active ? "bg-primary" : "hover:bg-muted",
        className,
      )}
    >
      {typeof children === "string" ? (
        <span className={cn("cube-rn-text", segmentedTextClass(active))}>{children}</span>
      ) : (
        children
      )}
    </button>
  );
}
