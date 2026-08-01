"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validation";
import { PasswordInput } from "@/components/password-input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const result = loginSchema.safeParse({ email, password });
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
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setServerError("Invalid email or password");
    } else {
      router.push("/tracker");
      router.refresh();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-charcoal">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-medium text-primary hover:text-primary-deep">
          Sign up
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {registered && (
          <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            Account created successfully. Please sign in.
          </div>
        )}

        {serverError && (
          <div className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-graphite">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full rounded-md border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-graphite focus:outline-none ${
              errors.email ? "border-error focus:border-error" : "border-steel focus:border-ink"
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
        </div>

        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          error={errors.password}
        />

        <div className="flex items-center justify-end">
          <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:text-primary-deep">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-canvas px-2 text-graphite">or continue with</span>
        </div>
      </div>

      <button
        onClick={() => {
          window.location.href = "/api/auth/signin/google";
        }}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-hairline bg-canvas py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cloud"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>
    </div>
  );
}
