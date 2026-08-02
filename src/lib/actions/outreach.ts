"use server";

import { db } from "@/lib/db";
import { outreachMessages, applications, companies, contacts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { addOutreachSchema, updateOutreachSchema } from "@/lib/validation";

export type OutreachWithRelations = {
  id: string;
  applicationId: string;
  contactId: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  sentAt: string | null;
  jobTitle: string;
  companyName: string;
  contactName: string;
  contactEmail: string | null;
};

export async function getOutreachMessages(): Promise<OutreachWithRelations[]> {
  try {
    const rows = await db
      .select({
        id: outreachMessages.id,
        applicationId: outreachMessages.applicationId,
        contactId: outreachMessages.contactId,
        channel: outreachMessages.channel,
        subject: outreachMessages.subject,
        body: outreachMessages.body,
        status: outreachMessages.status,
        sentAt: outreachMessages.sentAt,
        jobTitle: applications.jobTitle,
        companyName: companies.name,
        contactName: contacts.name,
        contactEmail: contacts.email,
      })
      .from(outreachMessages)
      .leftJoin(applications, eq(outreachMessages.applicationId, applications.id))
      .leftJoin(companies, eq(applications.companyId, companies.id))
      .leftJoin(contacts, eq(outreachMessages.contactId, contacts.id));

    return rows.map((r) => ({
      id: r.id,
      applicationId: r.applicationId,
      contactId: r.contactId,
      channel: r.channel,
      subject: r.subject,
      body: r.body,
      status: r.status,
      sentAt: r.sentAt,
      jobTitle: r.jobTitle ?? "",
      companyName: r.companyName ?? "",
      contactName: r.contactName ?? "",
      contactEmail: r.contactEmail,
    }));
  } catch (e) {
    console.error("[getOutreachMessages]", e);
    return [];
  }
}

export async function addOutreachMessage(data: {
  applicationId: string;
  contactId: string;
  channel: string;
  subject?: string;
  body: string;
}) {
  try {
    const parsed = addOutreachSchema.parse(data);
    const [msg] = await db
      .insert(outreachMessages)
      .values({
        id: crypto.randomUUID(),
        applicationId: parsed.applicationId,
        contactId: parsed.contactId,
        channel: parsed.channel,
        subject: parsed.subject || undefined,
        body: parsed.body,
      })
      .returning();
    return msg;
  } catch (e) {
    console.error("[addOutreachMessage]", e);
    throw new Error("Failed to add outreach message");
  }
}

export async function updateOutreachStatus(id: string, status: string) {
  try {
    await db
      .update(outreachMessages)
      .set({
        status,
        sentAt: status === "sent" ? new Date().toISOString() : undefined,
      })
      .where(eq(outreachMessages.id, id));
  } catch (e) {
    console.error("[updateOutreachStatus]", e);
    throw new Error("Failed to update outreach status");
  }
}

export async function deleteOutreachMessage(id: string) {
  try {
    await db.delete(outreachMessages).where(eq(outreachMessages.id, id));
  } catch (e) {
    console.error("[deleteOutreachMessage]", e);
    throw new Error("Failed to delete outreach message");
  }
}

export async function updateOutreachMessage(
  id: string,
  data: {
    channel?: string;
    subject?: string;
    body?: string;
  }
) {
  try {
    const parsed = updateOutreachSchema.parse(data);
    await db
      .update(outreachMessages)
      .set({
        ...parsed,
        subject: parsed.subject || undefined,
      })
      .where(eq(outreachMessages.id, id));
  } catch (e) {
    console.error("[updateOutreachMessage]", e);
    throw new Error("Failed to update outreach message");
  }
}
