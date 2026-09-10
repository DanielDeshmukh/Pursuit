"use server";

import { db } from "@/lib/db";
import { resumeVersions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/user";

export type ResumeVersion = {
  id: string;
  name: string;
  fileName: string | null;
  fileUrl: string | null;
  tailoringNotes: string | null;
  createdAt: string;
};

export async function getResumeVersions(): Promise<ResumeVersion[]> {
  try {
    const userId = await getCurrentUserId();
    return db
      .select({
        id: resumeVersions.id,
        name: resumeVersions.name,
        fileName: resumeVersions.fileName,
        fileUrl: resumeVersions.fileUrl,
        tailoringNotes: resumeVersions.tailoringNotes,
        createdAt: resumeVersions.createdAt,
      })
      .from(resumeVersions)
      .where(eq(resumeVersions.userId, userId))
      .orderBy(resumeVersions.createdAt);
  } catch (e) {
    console.error("[getResumeVersions]", e);
    return [];
  }
}

export async function addResumeVersion(data: {
  name: string;
  fileName?: string;
  fileUrl?: string;
  tailoringNotes?: string;
}): Promise<ResumeVersion> {
  try {
    const userId = await getCurrentUserId();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(resumeVersions).values({
      id,
      userId,
      name: data.name,
      fileName: data.fileName || null,
      fileUrl: data.fileUrl || null,
      tailoringNotes: data.tailoringNotes || null,
      createdAt: now,
    });

    return {
      id,
      name: data.name,
      fileName: data.fileName || null,
      fileUrl: data.fileUrl || null,
      tailoringNotes: data.tailoringNotes || null,
      createdAt: now,
    };
  } catch (e) {
    console.error("[addResumeVersion]", e);
    throw new Error("Failed to add resume version");
  }
}

export async function deleteResumeVersion(id: string) {
  try {
    await db.delete(resumeVersions).where(eq(resumeVersions.id, id));
  } catch (e) {
    console.error("[deleteResumeVersion]", e);
    throw new Error("Failed to delete resume version");
  }
}

export async function updateResumeVersion(
  id: string,
  data: { name?: string; tailoringNotes?: string }
) {
  try {
    await db.update(resumeVersions).set(data).where(eq(resumeVersions.id, id));
  } catch (e) {
    console.error("[updateResumeVersion]", e);
    throw new Error("Failed to update resume version");
  }
}
