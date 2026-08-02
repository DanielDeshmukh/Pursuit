import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, companies } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, companyName, salaryMin, salaryMax, source, jobUrl } = body;

    if (!jobTitle || !companyName) {
      return NextResponse.json({ error: "jobTitle and companyName are required" }, { status: 400 });
    }

    let companyId: string | null = null;

    if (companyName) {
      const existingCompany = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.name, companyName))
        .limit(1);

      if (existingCompany.length > 0) {
        companyId = existingCompany[0].id;
      } else {
        const [newCompany] = await db
          .insert(companies)
          .values({ name: companyName })
          .returning({ id: companies.id });
        companyId = newCompany.id;
      }
    }

    const [application] = await db
      .insert(applications)
      .values({
        jobTitle,
        companyId,
        jobUrl: jobUrl || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        source: source || null,
        status: "saved",
      })
      .returning({ id: applications.id });

    return NextResponse.json({ success: true, id: application.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
