import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/shared/SkipLink";

/** Public site shell: skip link, floating navbar, main content, footer. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SkipLink />
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
