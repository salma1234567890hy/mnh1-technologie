import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusScreen, statusPrimaryActionClass } from "@/components/shared/StatusScreen";
import fr from "@/lib/i18n/dictionaries/fr";

export const metadata: Metadata = {
  title: fr.notFound.metaTitle,
};

/** Admin 404 (French, like the whole Admin). Needed since the Admin is its own root layout. */
export default function AdminNotFound() {
  const t = fr.notFound;
  return (
    <StatusScreen label={t.label} title={t.title} text={t.text}>
      <Link href="/admin" className={statusPrimaryActionClass}>
        <ArrowLeft
          aria-hidden="true"
          size={16}
          className="transition-transform duration-300 ease-out group-hover/cta:-translate-x-0.5 motion-reduce:transition-none"
        />
        Retour au tableau de bord
      </Link>
    </StatusScreen>
  );
}
