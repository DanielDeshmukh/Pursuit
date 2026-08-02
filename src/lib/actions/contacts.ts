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
  try {
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
  } catch (e) {
    console.error("[getContacts]", e);
    return [];
  }
}

export async function getCompanies() {
  try {
    return db.select().from(companies);
  } catch (e) {
    console.error("[getCompanies]", e);
    return [];
  }
}

export async function addContact(data: {
  companyId: string;
  name: string;
  role?: string;
  email?: string;
  linkedinUrl?: string;
}) {
  try {
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
  } catch (e) {
    console.error("[addContact]", e);
    throw new Error("Failed to add contact");
  }
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
  try {
    await db
      .update(contacts)
      .set(data)
      .where(eq(contacts.id, id));
  } catch (e) {
    console.error("[updateContact]", e);
    throw new Error("Failed to update contact");
  }
}

export async function deleteContact(id: string) {
  try {
    await db.delete(contacts).where(eq(contacts.id, id));
  } catch (e) {
    console.error("[deleteContact]", e);
    throw new Error("Failed to delete contact");
  }
}
