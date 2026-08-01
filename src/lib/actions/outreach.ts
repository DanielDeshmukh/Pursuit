"use server";

import { db } from "@/lib/db";
import { outreachMessages, applications, companies, contacts } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
}

export async function addOutreachMessage(data: {
  applicationId: string;
  contactId: string;
  channel: string;
  subject?: string;
  body: string;
}) {
  const [msg] = await db
    .insert(outreachMessages)
    .values({
      id: crypto.randomUUID(),
      applicationId: data.applicationId,
      contactId: data.contactId,
      channel: data.channel,
      subject: data.subject,
      body: data.body,
    })
    .returning();
  return msg;
}

export async function updateOutreachStatus(id: string, status: string) {
  await db
    .update(outreachMessages)
    .set({
      status,
      sentAt: status === "sent" ? new Date().toISOString() : undefined,
    })
    .where(eq(outreachMessages.id, id));
}

export async function deleteOutreachMessage(id: string) {
  await db.delete(outreachMessages).where(eq(outreachMessages.id, id));
}
