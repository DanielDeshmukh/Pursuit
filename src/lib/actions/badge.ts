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
  const now = new Date().toISOString();
  const photo = data.photo && data.photo.length > 50000 ? null : (data.photo ?? null);

  const existing = await client.execute({
    sql: "SELECT id FROM badge_data WHERE user_id = ? LIMIT 1",
    args: ["default"],
  });

  if (existing.rows.length > 0) {
    await client.execute({
      sql: `UPDATE badge_data SET photo = ?, first_name = ?, overall = ?, position = ?, flag = ?, proj = ?, tech = ?, cont = ?, yexp = ?, cert = ?, lang = ?, updated_at = ? WHERE user_id = ?`,
      args: [
        photo, data.firstName ?? null, data.overall ?? null,
        data.position ?? null, data.flag ?? null,
        data.proj ?? null, data.tech ?? null, data.cont ?? null,
        data.yexp ?? null, data.cert ?? null, data.lang ?? null,
        now, "default",
      ],
    });
  } else {
    const id = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO badge_data (id, user_id, photo, first_name, overall, position, flag, proj, tech, cont, yexp, cert, lang, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, "default",
        photo, data.firstName ?? null, data.overall ?? null,
        data.position ?? null, data.flag ?? null,
        data.proj ?? null, data.tech ?? null, data.cont ?? null,
        data.yexp ?? null, data.cert ?? null, data.lang ?? null,
        now, now,
      ],
    });
  }

  return await getBadgeData();
}
