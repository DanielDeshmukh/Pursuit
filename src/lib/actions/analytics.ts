"use server";

import { db } from "@/lib/db";
import { applications, companies } from "@/lib/schema";
import { eq, gte, lte } from "drizzle-orm";

export async function getAnalytics(filters?: {
  from?: string;
  to?: string;
}) {
  try {
    let allApps;

    if (filters?.from || filters?.to) {
      let query = db
        .select({
          id: applications.id,
          status: applications.status,
          source: applications.source,
          appliedAt: applications.appliedAt,
          companyName: companies.name,
        })
        .from(applications)
        .leftJoin(companies, eq(applications.companyId, companies.id));

      if (filters.from) {
        query = query.where(gte(applications.appliedAt, filters.from)) as typeof query;
      }
      if (filters.to) {
        query = query.where(lte(applications.appliedAt, filters.to)) as typeof query;
      }

      allApps = await query;
    } else {
      allApps = await db
        .select({
          id: applications.id,
          status: applications.status,
          source: applications.source,
          appliedAt: applications.appliedAt,
          companyName: companies.name,
        })
        .from(applications)
        .leftJoin(companies, eq(applications.companyId, companies.id));
    }

    const total = allApps.length;
    const applied = allApps.filter((a) => a.status !== "SAVED").length;
    const interviews = allApps.filter(
      (a) => a.status === "INTERVIEW" || a.status === "PHONE_SCREEN"
    ).length;
    const offers = allApps.filter((a) => a.status === "OFFER").length;
    const rejected = allApps.filter(
      (a) => a.status === "REJECTED" || a.status === "GHOSTED"
    ).length;

    const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

    const bySource: Record<string, number> = {};
    allApps.forEach((a) => {
      const src = a.source || "Unknown";
      bySource[src] = (bySource[src] || 0) + 1;
    });

    const byStatus: Record<string, number> = {};
    allApps.forEach((a) => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    const byMonth: Record<string, number> = {};
    allApps.forEach((a) => {
      if (a.appliedAt) {
        const month = a.appliedAt.substring(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    });

    const timeSeries = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const funnel = {
      saved: allApps.filter((a) => a.status === "SAVED").length,
      applied: allApps.filter((a) =>
        ["APPLIED", "WALK_IN"].includes(a.status)
      ).length,
      screening: allApps.filter((a) =>
        ["PHONE_SCREEN"].includes(a.status)
      ).length,
      interview: allApps.filter((a) => a.status === "INTERVIEW").length,
      offer: allApps.filter((a) => a.status === "OFFER").length,
    };

    return {
      total,
      applied,
      interviews,
      offers,
      rejected,
      responseRate,
      bySource: Object.entries(bySource).map(([name, count]) => ({
        name,
        value: count,
      })),
      byStatus: Object.entries(byStatus).map(([name, count]) => ({
        name,
        value: count,
      })),
      timeSeries,
      funnel,
    };
  } catch (e) {
    console.error("[getAnalytics]", e);
    return {
      total: 0,
      applied: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
      responseRate: 0,
      bySource: [],
      byStatus: [],
      timeSeries: [],
      funnel: { saved: 0, applied: 0, screening: 0, interview: 0, offer: 0 },
    };
  }
}
