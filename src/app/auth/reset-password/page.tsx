"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { PasswordInput } from "@/components/password-input";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    const result = await resetPassword({
      token: "placeholder",
      password,
      confirmPassword,
    });
    setLoading(false);

    if (result.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-ink">Password reset</h1>
        <p className="mt-2 text-sm text-charcoal">
          Your password has been reset successfully.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary-deep">
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Reset password</h1>
      <p className="mt-2 text-sm text-charcoal">Enter your new password below.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {serverError && (
          <div className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            {serverError}
          </div>
        )}

        <PasswordInput
          id="password"
          label="New Password"
          value={password}
          onChange={setPassword}
          placeholder="Min 8 chars, alphanumeric"
          error={errors.password}
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter password"
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal">
        <Link href="/auth/login" className="font-medium text-primary hover:text-primary-deep">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
