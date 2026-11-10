import { connection } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // Indique à Next.js que cette route doit s'exécuter à chaque requête (pas de cache)
  await connection();

  try {
    const { rows } = await query<{ ok: number }>("SELECT 1 AS ok");
    return Response.json({ db: rows[0]?.ok === 1 ? "up" : "down" });
  } catch (error) {
    console.error("[health/db] Erreur de connexion :", error);
    return Response.json({ db: "down" }, { status: 503 });
  }
}