import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, "default"))
    .limit(1);
  return NextResponse.json(rows[0] || null);
}
