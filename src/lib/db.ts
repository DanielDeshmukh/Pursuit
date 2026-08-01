import { drizzle } from "drizzle-orm/libsql";
import { getTurso } from "./turso";
import * as schema from "./schema";

export const db = drizzle(getTurso(), { schema });
