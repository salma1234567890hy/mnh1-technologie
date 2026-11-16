import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/require-admin-page";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

/** Every Admin page checks the session itself (see lib/admin/require-admin-page.ts). */
async function DashboardContent() {
  await requireAdminPage();

  return (
    <h1 className="font-heading text-[1.75rem] leading-[1.15] font-bold tracking-[-0.015em] text-mnh-text-white lg:text-4xl">
      Tableau de bord
    </h1>
  );
}
