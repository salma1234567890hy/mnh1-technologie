"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { FooterLink } from "@/components/layout/footer/FooterLink";
import { isActivePath } from "@/components/layout/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localizedHref } from "@/lib/i18n/config";

/** href WITHOUT locale prefix (compared with the current path), label already translated. */
type FooterPageLinksProps = { links: { href: string; label: string }[] };

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
  const { locale } = useI18n();
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <FooterLink href={localizedHref(locale, link.href)} isActive={pathname !== null && isActivePath(pathname, link.href)}>
            {link.label}
          </FooterLink>
        </li>
      ))}
    </ul>
  );
}
