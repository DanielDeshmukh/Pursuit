"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { signupSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/auth";

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing.length) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email: parsed.data.email,
    passwordHash,
    name: parsed.data.name,
  });

  return { success: true };
}

export async function forgotPassword(data: { email: string }) {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!existing.length) {
    return { success: true };
  }

  return { success: true };
}

export async function resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = resetPasswordSchema.safeParse({
    password: data.password,
    confirmPassword: data.confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  return { success: true };
}
