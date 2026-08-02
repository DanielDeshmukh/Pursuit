"use server";

import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type ProfileData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: string | null;
  education: string | null;
  skills: string | null;
  workAuthorization: string | null;
  salaryExpectation: string | null;
  bio: string | null;
  coverLetterTemplate: string | null;
  customAnswers: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getProfile(): Promise<ProfileData | null> {
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

export async function upsertProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsExperience?: string;
  education?: string;
  skills?: string;
  workAuthorization?: string;
  salaryExpectation?: string;
  bio?: string;
  coverLetterTemplate?: string;
  customAnswers?: string;
}): Promise<ProfileData> {
  try {
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, "default"))
      .limit(1);

    const now = new Date().toISOString();

    if (existing.length > 0) {
      const [updated] = await db
        .update(profiles)
        .set({
          ...data,
          updatedAt: now,
        })
        .where(eq(profiles.id, "default"))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(profiles)
      .values({
        id: "default",
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  } catch (e) {
    console.error("[upsertProfile]", e);
    throw new Error("Failed to save profile");
  }
}
