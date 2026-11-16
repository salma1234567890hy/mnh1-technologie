import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { headerCta } from "@/components/layout/navigation";

type HeaderCtaProps = {
  className?: string;
  onClick?: () => void;
};

/** "Get In Touch" button — 46px, radius 12px, text + ↗ arrow (navbar & mobile panel). */
export function HeaderCta({ className, onClick }: HeaderCtaProps) {
  return (
    <Link
      href={headerCta.href}
      onClick={onClick}
      className={cn(
        "group/cta inline-flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-mnh-accent pr-[18px] pl-[22px] font-sans text-sm font-semibold tracking-[0.01em] whitespace-nowrap text-mnh-black",
        "transition-[background-color,box-shadow] duration-250 ease-out hover:bg-mnh-brand hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--mnh-accent)_30%,transparent)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent",
        className,
      )}
    >
      {headerCta.label}
      <ArrowUpRight
        aria-hidden="true"
        size={16}
        className="transition-transform duration-250 ease-out group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover/cta:translate-x-0 motion-reduce:group-hover/cta:translate-y-0"
      />
    </Link>
  );
}
