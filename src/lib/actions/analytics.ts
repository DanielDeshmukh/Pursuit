"use server";

import { db } from "@/lib/db";
import { applications, companies } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getAnalytics() {
  const allApps = await db
    .select({
      id: applications.id,
      status: applications.status,
      source: applications.source,
      appliedAt: applications.appliedAt,
      companyName: companies.name,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id));

  const total = allApps.length;
  const applied = allApps.filter(
    (a) => a.status !== "SAVED"
  ).length;
  const interviews = allApps.filter(
    (a) => a.status === "INTERVIEW" || a.status === "OFFER"
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
  };
}
