import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin root: no public header/footer, never indexed.
 * Children: /admin/login (standalone) and the (dashboard) shell.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div lang="fr" className="flex flex-1 flex-col bg-mnh-black font-sans text-mnh-text-white">
      {children}
    </div>
  );
}
