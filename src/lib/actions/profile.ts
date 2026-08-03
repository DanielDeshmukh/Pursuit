"use server";

import { getTurso } from "@/lib/turso";

const client = getTurso();

export async function getProfile() {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM profiles WHERE id = ? LIMIT 1",
      args: ["default"],
    });
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      ...r,
      firstName: r.first_name,
      lastName: r.last_name,
      zipCode: r.zip_code,
      linkedinUrl: r.linkedin_url,
      githubUrl: r.github_url,
      portfolioUrl: r.portfolio_url,
      currentTitle: r.current_title,
      currentCompany: r.current_company,
      yearsExperience: r.years_experience,
      workAuthorization: r.work_authorship ?? r.work_authorization,
      salaryExpectation: r.salary_expectation,
      coverLetterTemplate: r.cover_letter_template,
      customAnswers: r.custom_answers,
      workExperience: r.work_experience,
    };
  } catch (e) {
    console.error("[getProfile]", e);
    return null;
  }
}

export async function upsertProfile(data: Record<string, string | null | undefined>) {
  try {
    const existing = await client.execute({
      sql: "SELECT id FROM profiles WHERE id = ? LIMIT 1",
      args: ["default"],
    });

    const now = new Date().toISOString();

    const cols = [
      "firstName", "lastName", "email", "phone", "address", "city", "state",
      "zipCode", "country", "linkedinUrl", "githubUrl", "portfolioUrl", "currentTitle",
      "currentCompany", "yearsExperience", "education", "skills",
      "workAuthorization", "salaryExpectation", "bio", "coverLetterTemplate",
      "customAnswers", "photo", "summary", "workExperience", "projects",
    ];

    const colMap: Record<string, string> = {
      firstName: "first_name", lastName: "last_name", email: "email",
      phone: "phone", address: "address", city: "city", state: "state",
      zipCode: "zip_code", country: "country", linkedinUrl: "linkedin_url",
      githubUrl: "github_url", portfolioUrl: "portfolio_url", currentTitle: "current_title",
      currentCompany: "current_company", yearsExperience: "years_experience",
      education: "education", skills: "skills",
      workAuthorization: "work_authorization",
      salaryExpectation: "salary_expectation", bio: "bio",
      coverLetterTemplate: "cover_letter_template",
      customAnswers: "custom_answers", photo: "photo",
      summary: "summary", workExperience: "work_experience",
      projects: "projects",
    };

    const setClauses: string[] = [];
    const args: (string | null)[] = [];

    for (const key of cols) {
      const dbCol = colMap[key];
      setClauses.push(`${dbCol} = ?`);
      args.push(data[key] ?? null);
    }
    setClauses.push("updated_at = ?");
    args.push(now);

    if (existing.rows.length > 0) {
      args.push("default");
      await client.execute({
        sql: `UPDATE profiles SET ${setClauses.join(", ")} WHERE id = ?`,
        args,
      });
    } else {
      await client.execute({
        sql: `INSERT INTO profiles (id, ${Object.values(colMap).join(", ")}, created_at, updated_at) VALUES (?, ${cols.map(() => "?").join(", ")}, ?, ?)`,
        args: ["default", ...cols.map((k) => data[k] ?? null), now, now],
      });
    }

    const result = await client.execute({
      sql: "SELECT * FROM profiles WHERE id = ? LIMIT 1",
      args: ["default"],
    });
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      ...r,
      firstName: r.first_name,
      lastName: r.last_name,
      zipCode: r.zip_code,
      linkedinUrl: r.linkedin_url,
      githubUrl: r.github_url,
      portfolioUrl: r.portfolio_url,
      currentTitle: r.current_title,
      currentCompany: r.current_company,
      yearsExperience: r.years_experience,
      workAuthorization: r.work_authorship ?? r.work_authorization,
      salaryExpectation: r.salary_expectation,
      coverLetterTemplate: r.cover_letter_template,
      customAnswers: r.custom_answers,
      workExperience: r.work_experience,
    };
  } catch (e) {
    console.error("[upsertProfile]", e);
    throw new Error("Failed to save profile");
  }
}
