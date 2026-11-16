import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Connexion Admin",
};

export default function AdminLoginPage() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      {/* Session read at request time (cacheComponents): behind its own boundary, renders nothing. */}
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <section
        aria-labelledby="admin-login-heading"
        className="w-full max-w-md rounded-2xl border border-mnh-white/8 bg-mnh-dark-elevated p-8 sm:p-10"
      >
        <Image src="/brand/mnh-logo-white.png" alt="MNH Technologie" width={40} height={40} className="size-10 object-contain" />
        <h1
          id="admin-login-heading"
          className="mt-6 font-heading text-[1.75rem] leading-[1.15] font-bold tracking-[-0.015em] text-mnh-text-white"
        >
          Connexion Admin
        </h1>
        <p className="mt-2 text-[0.9375rem] leading-[1.7] text-mnh-text-muted-dark">
          Espace réservé à l&apos;équipe MNH Technologie.
        </p>

        {/* Login form slot — built in a later card (POST /api/admin/login). */}
        <div className="mt-8" />
      </section>
    </main>
  );
}

/** Already signed in → straight to the dashboard. */
async function RedirectIfSignedIn() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");
  return null;
}
