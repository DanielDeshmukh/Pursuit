"use server";

import { getTurso } from "@/lib/turso";

const client = getTurso();

export type BadgeData = {
  id: string;
  userId: string;
  photo: string | null;
  firstName: string | null;
  overall: number | null;
  position: string | null;
  flag: string | null;
  proj: number | null;
  tech: number | null;
  cont: number | null;
  yexp: number | null;
  cert: number | null;
  lang: number | null;
};

export async function getBadgeData(): Promise<BadgeData | null> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM badge_data WHERE user_id = ? LIMIT 1",
      args: ["default"],
    });
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      id: r.id as string,
      userId: r.user_id as string,
      photo: r.photo as string | null,
      firstName: r.first_name as string | null,
      overall: r.overall as number | null,
      position: r.position as string | null,
      flag: r.flag as string | null,
      proj: r.proj as number | null,
      tech: r.tech as number | null,
      cont: r.cont as number | null,
      yexp: r.yexp as number | null,
      cert: r.cert as number | null,
      lang: r.lang as number | null,
    };
  } catch (e) {
    console.error("[getBadgeData]", e);
    return null;
  }
}

export async function upsertBadgeData(data: Partial<BadgeData>) {
  try {
    const existing = await client.execute({
      sql: "SELECT id FROM badge_data WHERE user_id = ? LIMIT 1",
      args: ["default"],
    });

    const now = new Date().toISOString();

    const cols = ["photo", "firstName", "overall", "position", "flag", "proj", "tech", "cont", "yexp", "cert", "lang"];
    const colMap: Record<string, string> = {
      photo: "photo", firstName: "first_name", overall: "overall",
      position: "position", flag: "flag", proj: "proj", tech: "tech",
      cont: "cont", yexp: "yexp", cert: "cert", lang: "lang",
    };

    const setClauses: string[] = [];
    const args: (string | number | null)[] = [];

    for (const key of cols) {
      const dbCol = colMap[key];
      setClauses.push(`${dbCol} = ?`);
      args.push(data[key as keyof BadgeData] ?? null);
    }
    setClauses.push("updated_at = ?");
    args.push(now);

    if (existing.rows.length > 0) {
      args.push("default");
      await client.execute({
        sql: `UPDATE badge_data SET ${setClauses.join(", ")} WHERE user_id = ?`,
        args,
      });
    } else {
      const id = crypto.randomUUID();
      await client.execute({
        sql: `INSERT INTO badge_data (id, user_id, ${Object.values(colMap).join(", ")}, created_at, updated_at) VALUES (?, ?, ${cols.map(() => "?").join(", ")}, ?, ?)`,
        args: [id, "default", ...cols.map((k) => data[k as keyof BadgeData] ?? null), now, now],
      });
    }

    return await getBadgeData();
  } catch (e) {
    console.error("[upsertBadgeData]", e);
    throw new Error("Failed to save badge data");
  }
}
