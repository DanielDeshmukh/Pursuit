"use server";

import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getProfile() {
  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, "default"))
      .limit(1);
    return rows[0] ?? null;
  } catch (e) {
    console.error("[getProfile]", e);
    return null;
  }
}

export async function upsertProfile(data: Record<string, string | null | undefined>) {
  try {
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, "default"))
      .limit(1);

    const now = new Date().toISOString();

    const fields: Record<string, string | null> = {};
    const allowed = [
      "firstName", "lastName", "email", "phone", "address", "city", "state",
      "zipCode", "country", "linkedinUrl", "portfolioUrl", "currentTitle",
      "currentCompany", "yearsExperience", "education", "skills",
      "workAuthorization", "salaryExpectation", "bio", "coverLetterTemplate",
      "customAnswers",
    ];
    for (const key of allowed) {
      fields[key] = data[key] ?? null;
    }

    if (existing.length > 0) {
      await db
        .update(profiles)
        .set({ ...fields, updatedAt: now })
        .where(eq(profiles.id, "default"));
    } else {
      await db.insert(profiles).values({
        id: "default",
        ...fields,
        createdAt: now,
        updatedAt: now,
      });
    }

    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, "default"))
      .limit(1);
    return rows[0];
  } catch (e) {
    console.error("[upsertProfile]", e);
    throw new Error("Failed to save profile");
  }
}
