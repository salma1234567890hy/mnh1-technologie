"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import {
  StatusScreen,
  statusPrimaryActionClass,
  statusSecondaryActionClass,
} from "@/components/shared/StatusScreen";
import fr from "@/lib/i18n/dictionaries/fr";

/** Admin runtime error (French). Replaces the former app/error.tsx for the Admin root layout. */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = fr.error;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen label={t.label} title={t.title} text={t.text}>
      <button type="button" onClick={() => retry()} className={statusPrimaryActionClass}>
        <RotateCcw
          aria-hidden="true"
          size={16}
          className="transition-transform duration-300 ease-out group-hover/cta:-rotate-45 motion-reduce:transition-none"
        />
        {t.retry}
      </button>
      <Link href="/admin" className={statusSecondaryActionClass}>
        Retour au tableau de bord
      </Link>
    </StatusScreen>
  );
}
