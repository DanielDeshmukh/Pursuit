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
  const photo = data.photo && data.photo.length > 50000 ? null : (data.photo ?? undefined);

  const existing = await client.execute({
    sql: "SELECT * FROM badge_data WHERE user_id = ? LIMIT 1",
    args: ["default"],
  });

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    const fields: Record<string, unknown> = {
      photo: photo !== undefined ? photo : (row.photo as string | null),
      first_name: data.firstName !== undefined ? data.firstName : (row.first_name as string | null),
      overall: data.overall !== undefined ? data.overall : (row.overall as number | null),
      position: data.position !== undefined ? data.position : (row.position as string | null),
      flag: data.flag !== undefined ? data.flag : (row.flag as string | null),
      proj: data.proj !== undefined ? data.proj : (row.proj as number | null),
      tech: data.tech !== undefined ? data.tech : (row.tech as number | null),
      cont: data.cont !== undefined ? data.cont : (row.cont as number | null),
      yexp: data.yexp !== undefined ? data.yexp : (row.yexp as number | null),
      cert: data.cert !== undefined ? data.cert : (row.cert as number | null),
      lang: data.lang !== undefined ? data.lang : (row.lang as number | null),
    };

    const cols = Object.keys(fields);
    const setClause = cols.map((c) => `${c} = ?`).join(", ");
    const args = [...Object.values(fields), now, "default"];

    await client.execute({
      sql: `UPDATE badge_data SET ${setClause}, updated_at = ? WHERE user_id = ?`,
      args,
    });
  } else {
    const id = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO badge_data (id, user_id, photo, first_name, overall, position, flag, proj, tech, cont, yexp, cert, lang, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, "default",
        photo ?? null, data.firstName ?? null, data.overall ?? null,
        data.position ?? null, data.flag ?? null,
        data.proj ?? null, data.tech ?? null, data.cont ?? null,
        data.yexp ?? null, data.cert ?? null, data.lang ?? null,
        now, now,
      ],
    });
  }

  return await getBadgeData();
}
