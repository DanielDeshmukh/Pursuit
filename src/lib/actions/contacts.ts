"use server";

import { db } from "@/lib/db";
import { contacts, companies } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { addContactSchema, updateContactSchema } from "@/lib/validation";
import { getCurrentUserId } from "@/lib/user";

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
    const userId = await getCurrentUserId();
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
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(companies.userId, userId));

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
    const userId = await getCurrentUserId();
    return db.select().from(companies).where(eq(companies.userId, userId));
  } catch (e) {
    console.error("[getCompanies]", e);
    return [];
  }
}

export async function addCompany(data: {
  name: string;
  website?: string;
  industry?: string;
  source?: string;
}) {
  try {
    const userId = await getCurrentUserId();
    const id = crypto.randomUUID();
    await db.insert(companies).values({
      id,
      userId,
      name: data.name,
      website: data.website || null,
      industry: data.industry || null,
      source: data.source || null,
    });
    return { id, userId, ...data };
  } catch (e) {
    console.error("[addCompany]", e);
    throw new Error("Failed to add company");
  }
}

export async function updateCompany(
  id: string,
  data: { name?: string; website?: string; industry?: string; source?: string }
) {
  try {
    await db.update(companies).set(data).where(eq(companies.id, id));
  } catch (e) {
    console.error("[updateCompany]", e);
    throw new Error("Failed to update company");
  }
}

export async function deleteCompany(id: string) {
  try {
    await db.delete(companies).where(eq(companies.id, id));
  } catch (e) {
    console.error("[deleteCompany]", e);
    throw new Error("Failed to delete company");
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
    const parsed = addContactSchema.parse(data);
    const [contact] = await db
      .insert(contacts)
      .values({
        id: crypto.randomUUID(),
        companyId: parsed.companyId,
        name: parsed.name,
        role: parsed.role || undefined,
        email: parsed.email || undefined,
        linkedinUrl: parsed.linkedinUrl || undefined,
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
    const parsed = updateContactSchema.parse(data);
    await db
      .update(contacts)
      .set({
        ...parsed,
        role: parsed.role || undefined,
        email: parsed.email || undefined,
        linkedinUrl: parsed.linkedinUrl || undefined,
      })
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
