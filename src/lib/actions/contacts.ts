"use server";

import { db } from "@/lib/db";
import { contacts, companies } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type ContactWithCompany = {
  id: string;
  companyId: string;
  name: string;
  role: string | null;
  email: string | null;
  linkedinUrl: string | null;
  lastContactedAt: string | null;
  companyName: string;
  companyWebsite: string | null;
};

export async function getContacts(): Promise<ContactWithCompany[]> {
  const rows = await db
    .select({
      id: contacts.id,
      companyId: contacts.companyId,
      name: contacts.name,
      role: contacts.role,
      email: contacts.email,
      linkedinUrl: contacts.linkedinUrl,
      lastContactedAt: contacts.lastContactedAt,
      companyName: companies.name,
      companyWebsite: companies.website,
    })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id));

  return rows.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    name: r.name,
    role: r.role,
    email: r.email,
    linkedinUrl: r.linkedinUrl,
    lastContactedAt: r.lastContactedAt,
    companyName: r.companyName ?? "",
    companyWebsite: r.companyWebsite,
  }));
}

export async function getCompanies() {
  return db.select().from(companies);
}

export async function addContact(data: {
  companyId: string;
  name: string;
  role?: string;
  email?: string;
  linkedinUrl?: string;
}) {
  const [contact] = await db
    .insert(contacts)
    .values({
      id: crypto.randomUUID(),
      companyId: data.companyId,
      name: data.name,
      role: data.role,
      email: data.email,
      linkedinUrl: data.linkedinUrl,
    })
    .returning();
  return contact;
}

export async function updateContact(
  id: string,
  data: {
    companyId?: string;
    name?: string;
    role?: string;
    email?: string;
    linkedinUrl?: string;
  }
) {
  await db
    .update(contacts)
    .set(data)
    .where(eq(contacts.id, id));
}

export async function deleteContact(id: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
}
