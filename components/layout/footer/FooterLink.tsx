import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FooterLinkProps = {
  href: string;
  children: ReactNode;
  /** External link: opens in a new tab with rel="noopener noreferrer". */
  external?: boolean;
  isActive?: boolean;
  ariaLabel?: string;
  className?: string;
};

/** Footer link: muted → white on hover, with a small ↗ that fades/slides in. */
export function FooterLink({ href, children, external, isActive, ariaLabel, className }: FooterLinkProps) {
  // The ↗ is absolutely positioned so it never takes space (keeps right-aligned columns flush).
  const classes = cn(
    "group/link relative inline-flex items-center rounded-sm transition-colors duration-200 ease-out",
    isActive ? "text-mnh-accent" : "text-mnh-text-muted-dark hover:text-mnh-text-white focus-visible:text-mnh-text-white",
    className,
  );
  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight
        aria-hidden="true"
        size={13}
        className="pointer-events-none absolute top-1/2 left-full ml-1 -mt-[6.5px] shrink-0 -translate-x-1 translate-y-0.5 opacity-0 transition-[opacity,translate] duration-200 ease-out group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:translate-y-0 group-focus-visible/link:opacity-100 motion-reduce:transition-none"
      />
    </>
  );

  if (external || /^(mailto|tel):/.test(href)) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} aria-current={isActive ? "page" : undefined} className={classes}>
      {content}
    </Link>
  );
}
