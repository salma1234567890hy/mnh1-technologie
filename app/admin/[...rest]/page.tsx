import { notFound } from "next/navigation";

/**
 * Catch-all of the Admin: an unknown /admin/… URL → app/admin/not-found.tsx (French, Admin root layout).
 * Without it, an unmatched URL has no top-level layout to render a 404 in (two root layouts).
 * Real Admin pages (e.g. app/admin/(dashboard)/applications/page.tsx) always win over this catch-all.
 */
export default function AdminCatchAllNotFound() {
  notFound();
}
