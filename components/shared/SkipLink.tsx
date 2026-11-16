/**
 * "Skip to content" link — first focusable element of the page.
 * Hidden until it receives keyboard focus, then shown above the floating navbar.
 * Text from the dictionary (dict.common.skipLink).
 */
export function SkipLink({ label, href = "#main" }: { label: string; href?: string }) {
  return (
    <a
      href={href}
      className="sr-only rounded-xl bg-mnh-accent px-5 py-3 font-sans text-[15px] font-semibold text-mnh-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent"
    >
      {label}
    </a>
  );
}
