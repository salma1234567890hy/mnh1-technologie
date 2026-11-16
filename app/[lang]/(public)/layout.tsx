import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/shared/SkipLink";
import { getDictionary } from "@/lib/i18n/get-dictionary";

/** Public site shell: skip link, floating navbar, main content, footer. */
export default async function PublicLayout({ children }: LayoutProps<"/[lang]">) {
  const { dict } = await getDictionary();

  return (
    <>
      <SkipLink label={dict.common.skipLink} />
      <SiteHeader />
      {/*
        Offsets content below the floating navbar.
        A section that handles its own top spacing (e.g. the Hero) can slide
        under the navbar by adding the `data-under-navbar` attribute.
      */}
      <div className="flex flex-1 flex-col pt-(--navbar-offset) has-[[data-under-navbar]]:pt-0">
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
