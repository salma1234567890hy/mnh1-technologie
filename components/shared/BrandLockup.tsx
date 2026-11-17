import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLockupSize = "navbar" | "footer";

/*
 * Sizes — docs/design-spec.md › Navbar (Logo, Nom de la société) and Footer (STUDIO).
 * navbar: icon 28px (36px ≥ xl), name hidden < 360px, then shown at every width;
 *         the name truncates rather than pushing the bar (the parent link is min-w-0).
 * footer: icon 32px, name always shown and never truncated: the lockup keeps its width and the footer
 *         grid gives the Studio column at least that width (minmax(min-content,3fr) in SiteFooter).
 * Name: Space Grotesk 14px, 600, uppercase, tracking 0.06em — « MNH » #F1F5F9, « TECHNOLOGIE » #67B02E
 * (dark backgrounds only), no gradient.
 */
const sizes: Record<BrandLockupSize, { px: number; icon: string; name: string; wrapper: string }> = {
  navbar: { px: 36, icon: "size-7 xl:size-9", name: "hidden truncate min-[22.5rem]:block", wrapper: "min-w-0" },
  footer: { px: 32, icon: "size-8", name: "block", wrapper: "shrink-0" },
};

type BrandLockupProps = {
  size: BrandLockupSize;
  /** Preload the icon (above the fold: navbar only). */
  preload?: boolean;
  className?: string;
};

/**
 * MNH icon + « MNH TECHNOLOGIE » name, for DARK backgrounds.
 * Decorative only (icon alt="" and name aria-hidden): the parent link carries the accessible
 * name (dict.common.homeLink), so screen readers announce the company once.
 */
export function BrandLockup({ size, preload, className }: BrandLockupProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", s.wrapper, className)}>
      <Image
        src="/brand/mnh-logo-white.png"
        alt=""
        width={s.px}
        height={s.px}
        preload={preload}
        className={cn("shrink-0 object-contain", s.icon)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "font-heading text-sm leading-none font-semibold tracking-[0.06em] whitespace-nowrap uppercase",
          s.name,
        )}
      >
        <span className="text-mnh-text-white">MNH</span> <span className="text-mnh-brand">Technologie</span>
      </span>
    </span>
  );
}
