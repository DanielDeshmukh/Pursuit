"use server";

import { db } from "@/lib/db";
import { applications, companies, contacts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getApplications() {
  const rows = await db
    .select({
      id: applications.id,
      userId: applications.userId,
      companyId: applications.companyId,
      contactId: applications.contactId,
      jobTitle: applications.jobTitle,
      jobUrl: applications.jobUrl,
      status: applications.status,
      salaryMin: applications.salaryMin,
      salaryMax: applications.salaryMax,
      source: applications.source,
      appliedAt: applications.appliedAt,
      resumeVersionUsed: applications.resumeVersionUsed,
      notes: applications.notes,
      nextFollowUpAt: applications.nextFollowUpAt,
      companyName: companies.name,
      companyWebsite: companies.website,
      companyIndustry: companies.industry,
      companySource: companies.source,
      contactName: contacts.name,
      contactRole: contacts.role,
      contactEmail: contacts.email,
      contactLinkedinUrl: contacts.linkedinUrl,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .leftJoin(contacts, eq(applications.contactId, contacts.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    companyId: row.companyId,
    contactId: row.contactId,
    jobTitle: row.jobTitle,
    jobUrl: row.jobUrl,
    status: row.status,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    source: row.source,
    appliedAt: row.appliedAt,
    resumeVersionUsed: row.resumeVersionUsed,
    notes: row.notes,
    nextFollowUpAt: row.nextFollowUpAt,
    company: {
      id: row.companyId,
      userId: row.userId,
      name: row.companyName ?? "",
      website: row.companyWebsite,
      industry: row.companyIndustry,
      source: row.companySource,
    },
    contact: row.contactName
      ? {
          id: row.contactId!,
          companyId: row.companyId,
          name: row.contactName,
          role: row.contactRole,
          email: row.contactEmail,
          linkedinUrl: row.contactLinkedinUrl,
          lastContactedAt: null,
        }
      : null,
  }));
}

export async function updateApplicationStatus(id: string, status: string) {
  await db
    .update(applications)
    .set({ status })
    .where(eq(applications.id, id));
}

export async function addApplication(data: {
  jobTitle: string;
  companyName: string;
  jobUrl?: string;
  salaryMin?: string;
  salaryMax?: string;
  source?: string;
  notes?: string;
  status?: string;
}) {
  const userId = "dev-user";

  const [company] = await db
    .insert(companies)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: data.companyName,
    })
    .returning();

  const [application] = await db
    .insert(applications)
    .values({
      id: crypto.randomUUID(),
      userId,
      companyId: company.id,
      jobTitle: data.jobTitle,
      jobUrl: data.jobUrl,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      source: data.source,
      notes: data.notes,
      status: data.status ?? "SAVED",
    })
    .returning();

  return application;
}

export async function deleteApplication(id: string) {
  await db.delete(applications).where(eq(applications.id, id));
}

export async function updateApplication(
  id: string,
  data: {
    jobTitle?: string;
    jobUrl?: string;
    status?: string;
    salaryMin?: string;
    salaryMax?: string;
    source?: string;
    notes?: string;
    resumeVersionUsed?: string;
    nextFollowUpAt?: string;
    contactId?: string | null;
  }
) {
  await db
    .update(applications)
    .set(data)
    .where(eq(applications.id, id));
}
