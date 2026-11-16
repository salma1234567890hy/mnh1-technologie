"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { FooterLink } from "@/components/layout/footer/FooterLink";
import { isActivePath, type NavigationLink } from "@/components/layout/navigation";

type FooterPageLinksProps = { links: NavigationLink[] };

/** Page links with the current page highlighted (usePathname inside Suspense, as in the navbar). */
export function FooterPageLinks({ links }: FooterPageLinksProps) {
  return (
    <Suspense fallback={<PageList links={links} pathname={null} />}>
      <PageListWithPathname links={links} />
    </Suspense>
  );
}

function PageListWithPathname({ links }: FooterPageLinksProps) {
  const pathname = usePathname();
  return <PageList links={links} pathname={pathname} />;
}

function PageList({ links, pathname }: FooterPageLinksProps & { pathname: string | null }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <FooterLink href={link.href} isActive={pathname !== null && isActivePath(pathname, link.href)}>
            {link.label}
          </FooterLink>
        </li>
      ))}
    </ul>
  );
}
