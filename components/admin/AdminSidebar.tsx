"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminLink = { label: string; href: string; icon: LucideIcon };

/** Routes mirror the admin API (/api/admin/applications, /api/admin/job-offers). */
export const adminNavigationLinks: AdminLink[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Candidatures", href: "/admin/applications", icon: Users },
  { label: "Offres", href: "/admin/job-offers", icon: Briefcase },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Display fields of the signed-in Admin, resolved on the server (getCurrentAdmin). */
export type AdminSidebarUser = { fullName: string; email: string };

export function AdminSidebar({ admin }: { admin: AdminSidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-b border-mnh-dark-border bg-mnh-dark-elevated lg:sticky lg:top-0 lg:h-svh lg:w-64 lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
        <Image src="/brand/mnh-logo-white.png" alt="" width={28} height={28} className="size-7 object-contain" />
        <span className="font-heading text-[15px] font-semibold text-mnh-text-white">
          MNH <span className="text-mnh-text-muted-dark">Admin</span>
        </span>
        {/* Mobile: signed-in Admin next to the logo (the sidebar footer is desktop only). */}
        <span className="ml-auto truncate text-xs text-mnh-text-muted-dark lg:hidden" title={admin.email}>
          {admin.fullName}
        </span>
      </div>

      <nav aria-label="Navigation Admin" className="px-2 pb-3 sm:px-4 lg:px-3 lg:pb-0">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {adminNavigationLinks.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    active
                      ? "border-mnh-accent bg-mnh-accent/8 text-mnh-accent"
                      : "border-transparent text-mnh-text-muted-dark hover:bg-mnh-white/5 hover:text-mnh-text-white",
                  )}
                >
                  <Icon aria-hidden="true" size={18} className="shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-mnh-dark-border px-5 py-4 lg:mt-auto lg:block">
        <p className="text-xs text-mnh-text-muted-dark">Connecté en tant que</p>
        <p className="mt-1 truncate text-sm font-medium text-mnh-text-white" title={admin.fullName}>
          {admin.fullName}
        </p>
        <p className="truncate text-xs text-mnh-text-muted-dark" title={admin.email}>
          {admin.email}
        </p>
      </div>
    </aside>
  );
}
