// lib/db/dashboard.ts
// Accès aux données : statistiques du dashboard Admin (F08). Lecture seule (rôle mnh_app : SELECT).
//
// FUSEAU HORAIRE : tous les jours sont des jours calendaires en heure du Maroc. Le fuseau
// 'Africa/Casablanca' est écrit explicitement dans chaque requête : rien ne dépend du fuseau de la base.
// Une période « Nd » couvre les N derniers jours calendaires, aujourd'hui inclus ; la période précédente
// couvre les N jours qui la précèdent immédiatement.
// Les bornes sont calculées une fois en timestamptz, et les colonnes sont comparées sans fonction
// (viewed_at >= start_ts) pour rester compatibles avec un index sur la date.
//
// Trafic : mesuré à partir des pages vues de la période (une session à cheval sur minuit compte pour chacun
// des deux jours). Les COUNT (bigint) sont convertis en ::int dans le SQL pour renvoyer des number.
// Requêtes SQL paramétrées uniquement ($1, $2…) — aucune concaténation de valeurs.

import "server-only";
import { query } from "@/lib/db";
import { OPEN_OFFER_CONDITION } from "@/lib/db/jobOffers";
import { PERIOD_DAYS, type Period } from "@/lib/validations/dashboard";

const TIME_ZONE = "Africa/Casablanca";

/**
 * Bornes de la période ($1 = nombre de jours), toutes calculées en heure du Maroc :
 * start_day / end_day (dates), start_ts / end_ts (période), prev_start_ts (début de la période précédente).
 * Le fuseau est une constante du code (jamais une valeur reçue), d'où son insertion directe dans le SQL.
 */
const BOUNDS_CTE = `bounds AS (
  SELECT
    d.today - ($1::int - 1) AS start_day,
    d.today AS end_day,
    ((d.today - ($1::int - 1))::timestamp AT TIME ZONE '${TIME_ZONE}') AS start_ts,
    ((d.today + 1)::timestamp AT TIME ZONE '${TIME_ZONE}') AS end_ts,
    ((d.today - (2 * $1::int - 1))::timestamp AT TIME ZONE '${TIME_ZONE}') AS prev_start_ts
  FROM (SELECT (now() AT TIME ZONE '${TIME_ZONE}')::date AS today) d
)`;

/** Statuts exacts des contraintes CHECK (ordre d'affichage). */
export const APPLICATION_STATUSES = ["EN_ATTENTE", "EN_COURS_EXAMEN", "ACCEPTEE", "REFUSEE"] as const;
export const CONTACT_STATUSES = ["NOUVEAU", "LU", "TRAITE"] as const;
export const OFFER_STATUSES = ["BROUILLON", "PUBLIEE", "DESACTIVEE", "ARCHIVEE"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];

// ---------------------------------------------------------------- Types des résultats

export type TrafficTotals = {
  visitors: number;
  sessions: number;
  pageViews: number;
  /** Pages vues / sessions, arrondi à 1 décimale (0 s'il n'y a aucune session). */
  pagesPerSession: number;
};

/** Évolution en % par rapport à la période précédente (1 décimale), ou null si la période précédente vaut 0. */
export type TrafficChange = { [K in keyof TrafficTotals]: number | null };

export type DashboardOverview = {
  period: Period;
  /** Première et dernière date couvertes (AAAA-MM-JJ, heure du Maroc). */
  range: { from: string; to: string };
  traffic: { current: TrafficTotals; previous: TrafficTotals; change: TrafficChange };
  applications: { receivedInPeriod: number; byStatus: Record<ApplicationStatus, number> };
  contactMessages: {
    receivedInPeriod: number;
    /** Messages au statut NOUVEAU (toutes dates). */
    unread: number;
    /** Messages NOUVEAU ou LU (toutes dates). */
    untreated: number;
    byStatus: Record<ContactStatus, number>;
  };
  jobOffers: { byStatus: Record<OfferStatus, number>; open: number };
};

export type TrafficSeriesPoint = { date: string; visitors: number; sessions: number; pageViews: number };

export type BreakdownItem = { label: string; sessions: number };

export type TrafficBreakdown = {
  period: Period;
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  /** Domaine du référent ; "direct" quand il est absent. */
  sources: BreakdownItem[];
};

export type TopPage = { path: string; pageViews: number; uniqueVisitors: number };

// ---------------------------------------------------------------- Outils

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Transforme des lignes { status, count } en objet complet (statuts absents à 0). */
function toStatusRecord<S extends string>(statuses: readonly S[], rows: { status: string; count: number }[]) {
  const record = Object.fromEntries(statuses.map((s) => [s, 0])) as Record<S, number>;
  for (const row of rows) {
    if ((statuses as readonly string[]).includes(row.status)) record[row.status as S] = row.count;
  }
  return record;
}

// ---------------------------------------------------------------- Requêtes

type TrafficRow = {
  from_day: string;
  to_day: string;
  cur_visitors: number;
  cur_sessions: number;
  cur_page_views: number;
  cur_pps: string;
  prev_visitors: number;
  prev_sessions: number;
  prev_page_views: number;
  prev_pps: string;
};

async function getTrafficTotals(days: number): Promise<TrafficRow> {
  const { rows } = await query<TrafficRow>(
    `WITH ${BOUNDS_CTE},
     cur AS (
       SELECT count(*)::int AS pv, count(DISTINCT pv.session_id)::int AS s, count(DISTINCT vs.visitor_id)::int AS v
       FROM page_view pv
       JOIN visitor_session vs ON vs.id = pv.session_id
       CROSS JOIN bounds b
       WHERE pv.viewed_at >= b.start_ts AND pv.viewed_at < b.end_ts
     ),
     prev AS (
       SELECT count(*)::int AS pv, count(DISTINCT pv.session_id)::int AS s, count(DISTINCT vs.visitor_id)::int AS v
       FROM page_view pv
       JOIN visitor_session vs ON vs.id = pv.session_id
       CROSS JOIN bounds b
       WHERE pv.viewed_at >= b.prev_start_ts AND pv.viewed_at < b.start_ts
     )
     SELECT
       to_char(b.start_day, 'YYYY-MM-DD') AS from_day,
       to_char(b.end_day, 'YYYY-MM-DD') AS to_day,
       cur.v AS cur_visitors, cur.s AS cur_sessions, cur.pv AS cur_page_views,
       CASE WHEN cur.s = 0 THEN 0 ELSE round(cur.pv::numeric / cur.s, 1) END AS cur_pps,
       prev.v AS prev_visitors, prev.s AS prev_sessions, prev.pv AS prev_page_views,
       CASE WHEN prev.s = 0 THEN 0 ELSE round(prev.pv::numeric / prev.s, 1) END AS prev_pps
     FROM bounds b, cur, prev`,
    [days]
  );
  return rows[0];
}

/** Vue d'ensemble : trafic (et évolution), candidatures, messages de contact, offres. */
export async function getDashboardOverview(period: Period): Promise<DashboardOverview> {
  const days = PERIOD_DAYS[period];

  const [traffic, applicationsInPeriod, applicationStatuses, contactInPeriod, contactStatuses, offerStatuses, openOffers] =
    await Promise.all([
      getTrafficTotals(days),
      query<{ count: number }>(
        `WITH ${BOUNDS_CTE}
         SELECT count(*)::int AS count
         FROM application a CROSS JOIN bounds b
         WHERE a.created_at >= b.start_ts AND a.created_at < b.end_ts`,
        [days]
      ),
      query<{ status: string; count: number }>(
        `SELECT status, count(*)::int AS count FROM application GROUP BY status`
      ),
      query<{ count: number }>(
        `WITH ${BOUNDS_CTE}
         SELECT count(*)::int AS count
         FROM contact_message m CROSS JOIN bounds b
         WHERE m.created_at >= b.start_ts AND m.created_at < b.end_ts`,
        [days]
      ),
      query<{ status: string; count: number }>(
        `SELECT status, count(*)::int AS count FROM contact_message GROUP BY status`
      ),
      query<{ status: string; count: number }>(
        `SELECT status, count(*)::int AS count FROM job_offer GROUP BY status`
      ),
      query<{ count: number }>(`SELECT count(*)::int AS count FROM job_offer WHERE ${OPEN_OFFER_CONDITION}`),
    ]);

  const current: TrafficTotals = {
    visitors: traffic.cur_visitors,
    sessions: traffic.cur_sessions,
    pageViews: traffic.cur_page_views,
    pagesPerSession: Number(traffic.cur_pps),
  };
  const previous: TrafficTotals = {
    visitors: traffic.prev_visitors,
    sessions: traffic.prev_sessions,
    pageViews: traffic.prev_page_views,
    pagesPerSession: Number(traffic.prev_pps),
  };

  const contactByStatus = toStatusRecord(CONTACT_STATUSES, contactStatuses.rows);

  return {
    period,
    range: { from: traffic.from_day, to: traffic.to_day },
    traffic: {
      current,
      previous,
      change: {
        visitors: percentChange(current.visitors, previous.visitors),
        sessions: percentChange(current.sessions, previous.sessions),
        pageViews: percentChange(current.pageViews, previous.pageViews),
        pagesPerSession: percentChange(current.pagesPerSession, previous.pagesPerSession),
      },
    },
    applications: {
      receivedInPeriod: applicationsInPeriod.rows[0].count,
      byStatus: toStatusRecord(APPLICATION_STATUSES, applicationStatuses.rows),
    },
    contactMessages: {
      receivedInPeriod: contactInPeriod.rows[0].count,
      unread: contactByStatus.NOUVEAU,
      untreated: contactByStatus.NOUVEAU + contactByStatus.LU,
      byStatus: contactByStatus,
    },
    jobOffers: {
      byStatus: toStatusRecord(OFFER_STATUSES, offerStatuses.rows),
      open: openOffers.rows[0].count,
    },
  };
}

/** Une ligne par jour de la période (jours sans visite à 0), du plus ancien au plus récent. */
export async function getTrafficSeries(period: Period): Promise<TrafficSeriesPoint[]> {
  const { rows } = await query<TrafficSeriesPoint>(
    `WITH ${BOUNDS_CTE},
     days AS (
       SELECT generate_series(b.start_day, b.end_day, interval '1 day')::date AS day FROM bounds b
     ),
     agg AS (
       SELECT
         (pv.viewed_at AT TIME ZONE '${TIME_ZONE}')::date AS day,
         count(DISTINCT vs.visitor_id)::int AS visitors,
         count(DISTINCT pv.session_id)::int AS sessions,
         count(*)::int AS page_views
       FROM page_view pv
       JOIN visitor_session vs ON vs.id = pv.session_id
       CROSS JOIN bounds b
       WHERE pv.viewed_at >= b.start_ts AND pv.viewed_at < b.end_ts
       GROUP BY 1
     )
     SELECT
       to_char(d.day, 'YYYY-MM-DD') AS "date",
       COALESCE(a.visitors, 0) AS visitors,
       COALESCE(a.sessions, 0) AS sessions,
       COALESCE(a.page_views, 0) AS "pageViews"
     FROM days d
     LEFT JOIN agg a ON a.day = d.day
     ORDER BY d.day`,
    [PERIOD_DAYS[period]]
  );
  return rows;
}

/**
 * Répartition des sessions actives sur la période (au moins une page vue) par appareil, navigateur et source.
 * Triée par nombre décroissant, puis par libellé.
 */
export async function getTrafficBreakdown(period: Period): Promise<TrafficBreakdown> {
  const { rows } = await query<{ kind: "device" | "browser" | "source"; label: string; sessions: number }>(
    `WITH ${BOUNDS_CTE},
     s AS (
       SELECT DISTINCT vs.id, vs.device_type, vs.browser_family, vs.referrer_host
       FROM page_view pv
       JOIN visitor_session vs ON vs.id = pv.session_id
       CROSS JOIN bounds b
       WHERE pv.viewed_at >= b.start_ts AND pv.viewed_at < b.end_ts
     )
     SELECT 'device' AS kind, device_type AS label, count(*)::int AS sessions FROM s GROUP BY device_type
     UNION ALL
     SELECT 'browser', COALESCE(browser_family, 'Inconnu'), count(*)::int FROM s GROUP BY COALESCE(browser_family, 'Inconnu')
     UNION ALL
     SELECT 'source', COALESCE(referrer_host, 'direct'), count(*)::int FROM s GROUP BY COALESCE(referrer_host, 'direct')
     ORDER BY kind, sessions DESC, label`,
    [PERIOD_DAYS[period]]
  );

  const pick = (kind: string) => rows.filter((r) => r.kind === kind).map(({ label, sessions }) => ({ label, sessions }));
  return { period, devices: pick("device"), browsers: pick("browser"), sources: pick("source") };
}

/** Pages les plus vues sur la période (pages vues décroissantes, puis chemin). */
export async function getTopPages(period: Period, limit: number): Promise<TopPage[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 50);
  const { rows } = await query<TopPage>(
    `WITH ${BOUNDS_CTE}
     SELECT
       pv.path,
       count(*)::int AS "pageViews",
       count(DISTINCT vs.visitor_id)::int AS "uniqueVisitors"
     FROM page_view pv
     JOIN visitor_session vs ON vs.id = pv.session_id
     CROSS JOIN bounds b
     WHERE pv.viewed_at >= b.start_ts AND pv.viewed_at < b.end_ts
     GROUP BY pv.path
     ORDER BY "pageViews" DESC, pv.path
     LIMIT $2`,
    [PERIOD_DAYS[period], safeLimit]
  );
  return rows;
}
