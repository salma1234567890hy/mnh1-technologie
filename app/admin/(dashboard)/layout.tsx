import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminPage } from "@/lib/admin/require-admin-page";

/**
 * Admin shell (sidebar + content), shown only with a valid session.
 *
 * cacheComponents: the session read (cookies()) happens at request time, so the whole shell
 * sits behind <Suspense>. The fallback is neutral: nothing from the Admin is shown before
 * the session is checked.
 *
 * ⚠️ Layouts are not re-rendered on client navigation (Partial Rendering) and do not stop
 * the page segment from rendering: EVERY Admin page must call
 * requireAdminPage() itself (lib/admin/require-admin-page.ts), and every /api/admin/* route keeps requireAdmin().
 */
export default function AdminDashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Only the display fields reach the client component (no id). */}
      <AdminSidebar admin={{ fullName: admin.full_name, email: admin.email }} />
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

function AdminShellFallback() {
  return (
    <div className="flex flex-1 items-center justify-center" role="status">
      <span className="sr-only">Vérification de la session…</span>
    </div>
  );
}
