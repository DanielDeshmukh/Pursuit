"use server";

import { db } from "@/lib/db";
import { applications, contacts, companies, outreachMessages, reminders } from "@/lib/schema";
import { eq, like, or, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/user";

export type SearchResult = {
  type: "application" | "contact" | "company" | "outreach" | "reminder";
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const userId = await getCurrentUserId();
    const pattern = `%${query}%`;

    const [apps, contactsList, companiesList, outreachList, remindersList] = await Promise.all([
      db
        .select({
          id: applications.id,
          jobTitle: applications.jobTitle,
          companyName: companies.name,
          status: applications.status,
        })
        .from(applications)
        .leftJoin(companies, eq(applications.companyId, companies.id))
        .where(
          and(
            eq(applications.userId, userId),
            or(
              like(applications.jobTitle, pattern),
              like(companies.name, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({
          id: contacts.id,
          name: contacts.name,
          role: contacts.role,
          companyName: companies.name,
        })
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(
          and(
            eq(companies.userId, userId),
            or(
              like(contacts.name, pattern),
              like(contacts.role, pattern),
              like(companies.name, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
        })
        .from(companies)
        .where(
          and(
            eq(companies.userId, userId),
            or(
              like(companies.name, pattern),
              like(companies.industry, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({
          id: outreachMessages.id,
          subject: outreachMessages.subject,
          contactName: contacts.name,
          companyName: companies.name,
        })
        .from(outreachMessages)
        .leftJoin(applications, eq(outreachMessages.applicationId, applications.id))
        .leftJoin(companies, eq(applications.companyId, companies.id))
        .leftJoin(contacts, eq(outreachMessages.contactId, contacts.id))
        .where(
          and(
            eq(applications.userId, userId),
            or(
              like(outreachMessages.subject, pattern),
              like(outreachMessages.body, pattern),
              like(contacts.name, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({
          id: reminders.id,
          type: reminders.type,
          jobTitle: applications.jobTitle,
          companyName: companies.name,
        })
        .from(reminders)
        .leftJoin(applications, eq(reminders.applicationId, applications.id))
        .leftJoin(companies, eq(applications.companyId, companies.id))
        .where(
          and(
            eq(applications.userId, userId),
            or(
              like(reminders.type, pattern),
              like(applications.jobTitle, pattern)
            )
          )
        )
        .limit(5),
    ]);

    const results: SearchResult[] = [];

    apps.forEach((a) =>
      results.push({
        type: "application",
        id: a.id,
        title: a.jobTitle,
        subtitle: `${a.companyName} · ${a.status}`,
        url: "/tracker",
      })
    );

    contactsList.forEach((c) =>
      results.push({
        type: "contact",
        id: c.id,
        title: c.name,
        subtitle: [c.role, c.companyName].filter(Boolean).join(" @ "),
        url: "/contacts",
      })
    );

    companiesList.forEach((c) =>
      results.push({
        type: "company",
        id: c.id,
        title: c.name,
        subtitle: c.industry || "Company",
        url: "/contacts",
      })
    );

    outreachList.forEach((o) =>
      results.push({
        type: "outreach",
        id: o.id,
        title: o.subject || "Outreach message",
        subtitle: [o.contactName, o.companyName].filter(Boolean).join(" @ "),
        url: "/outreach",
      })
    );

    remindersList.forEach((r) =>
      results.push({
        type: "reminder",
        id: r.id,
        title: r.type,
        subtitle: [r.jobTitle, r.companyName].filter(Boolean).join(" @ "),
        url: "/reminders",
      })
    );

    return results;
  } catch (e) {
    console.error("[globalSearch]", e);
    return [];
  }
}
