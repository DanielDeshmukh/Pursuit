"use server";

import { db } from "@/lib/db";
import { applications, companies, contacts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { addApplicationSchema, updateApplicationSchema } from "@/lib/validation";
import { getCurrentUserId } from "@/lib/user";

export interface ApplicationWithRelations {
  id: string;
  userId: string;
  companyId: string;
  contactId: string | null;
  jobTitle: string;
  jobUrl: string | null;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  source: string | null;
  appliedAt: string | null;
  resumeVersionUsed: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  company: {
    id: string;
    userId: string;
    name: string;
    website: string | null;
    industry: string | null;
    source: string | null;
  } | null;
  contact: {
    id: string;
    companyId: string;
    name: string;
    role: string | null;
    email: string | null;
    linkedinUrl: string | null;
    lastContactedAt: string | null;
  } | null;
}

export async function getApplications() {
  try {
    const userId = await getCurrentUserId();
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
      .leftJoin(contacts, eq(applications.contactId, contacts.id))
      .where(eq(applications.userId, userId));

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
  } catch (e) {
    console.error("[getApplications]", e);
    return [];
  }
}

export async function updateApplicationStatus(id: string, status: string) {
  try {
    await db.update(applications).set({ status }).where(eq(applications.id, id));
  } catch (e) {
    console.error("[updateApplicationStatus]", e);
    throw new Error("Failed to update application status");
  }
}

export async function addApplication(data: {
  jobTitle: string;
  companyName: string;
  jobUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  source?: string;
  notes?: string;
  status?: string;
}) {
  try {
    const parsed = addApplicationSchema.parse(data);
    const userId = await getCurrentUserId();

    const [company] = await db
      .insert(companies)
      .values({
        id: crypto.randomUUID(),
        userId,
        name: parsed.companyName,
      })
      .returning();

    const [application] = await db
      .insert(applications)
      .values({
        id: crypto.randomUUID(),
        userId,
        companyId: company.id,
        jobTitle: parsed.jobTitle,
        jobUrl: parsed.jobUrl || undefined,
        salaryMin: parsed.salaryMin || undefined,
        salaryMax: parsed.salaryMax || undefined,
        source: parsed.source || undefined,
        notes: parsed.notes || undefined,
        status: parsed.status ?? "SAVED",
      })
      .returning();

    return application;
  } catch (e) {
    console.error("[addApplication]", e);
    throw new Error("Failed to add application");
  }
}

export async function deleteApplication(id: string) {
  try {
    await db.delete(applications).where(eq(applications.id, id));
  } catch (e) {
    console.error("[deleteApplication]", e);
    throw new Error("Failed to delete application");
  }
}

export async function updateApplication(
  id: string,
  data: {
    jobTitle?: string;
    jobUrl?: string;
    status?: string;
    salaryMin?: number;
    salaryMax?: number;
    source?: string;
    notes?: string;
    resumeVersionUsed?: string;
    nextFollowUpAt?: string;
    contactId?: string | null;
  }
) {
  try {
    const parsed = updateApplicationSchema.parse(data);
    const updateData: Record<string, unknown> = { ...parsed };
    if (updateData.salaryMin === "") updateData.salaryMin = null;
    if (updateData.salaryMax === "") updateData.salaryMax = null;
    await db.update(applications).set(updateData).where(eq(applications.id, id));
  } catch (e) {
    console.error("[updateApplication]", e);
    throw new Error("Failed to update application");
  }
}
