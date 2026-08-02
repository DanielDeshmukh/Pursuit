"use server";

import { db } from "@/lib/db";
import { reminders, applications, companies } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export type ReminderWithApp = {
  id: string;
  applicationId: string;
  type: string;
  dueAt: string;
  done: boolean;
  jobTitle: string;
  companyName: string;
};

export async function getReminders(): Promise<ReminderWithApp[]> {
  const rows = await db
    .select({
      id: reminders.id,
      applicationId: reminders.applicationId,
      type: reminders.type,
      dueAt: reminders.dueAt,
      done: reminders.done,
      jobTitle: applications.jobTitle,
      companyName: companies.name,
    })
    .from(reminders)
    .leftJoin(applications, eq(reminders.applicationId, applications.id))
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .orderBy(asc(reminders.dueAt));

  return rows.map((r) => ({
    id: r.id,
    applicationId: r.applicationId,
    type: r.type,
    dueAt: r.dueAt,
    done: r.done,
    jobTitle: r.jobTitle ?? "",
    companyName: r.companyName ?? "",
  }));
}

export async function addReminder(data: {
  applicationId: string;
  type: string;
  dueAt: string;
}) {
  const [reminder] = await db
    .insert(reminders)
    .values({
      id: crypto.randomUUID(),
      applicationId: data.applicationId,
      type: data.type,
      dueAt: data.dueAt,
    })
    .returning();
  return reminder;
}

export async function toggleReminder(id: string, done: boolean) {
  await db
    .update(reminders)
    .set({ done })
    .where(eq(reminders.id, id));
}

export async function deleteReminder(id: string) {
  await db.delete(reminders).where(eq(reminders.id, id));
}

export async function updateReminder(
  id: string,
  data: {
    applicationId?: string;
    type?: string;
    dueAt?: string;
  }
) {
  await db
    .update(reminders)
    .set(data)
    .where(eq(reminders.id, id));
}
