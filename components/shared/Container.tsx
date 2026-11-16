import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

type ContainerProps<T extends ElementType> = {
  /** Rendered element (default: div). */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Page container — docs/design-spec.md › Espacements globaux:
 * max-width 1280px, horizontal padding 16px (mobile) / 24px (≥ sm).
 */
export function Container<T extends ElementType = "div">({ as, className, ...props }: ContainerProps<T>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)} {...props} />;
}
