import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import fr from "@/lib/i18n/dictionaries/fr";
import "../globals.css";

export const metadata: Metadata = {
  title: { template: `%s | ${fr.meta.title}`, default: fr.meta.title },
  description: fr.meta.description,
  robots: { index: false, follow: false },
};

/**
 * Admin ROOT layout (second root next to app/[lang]): always French, no public header/footer,
 * never indexed. Same fonts and global styles as the public site (lib/fonts.ts, globals.css).
 * The Admin is not translated: its texts stay in French in its own components.
 * Access control is unchanged: requireAdminPage() in each page, requireAdmin() in the API.
 * Children: /admin/login (standalone) and the (dashboard) shell.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="fr" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col bg-mnh-black font-sans text-mnh-text-white">{children}</div>
      </body>
    </html>
  );
}
