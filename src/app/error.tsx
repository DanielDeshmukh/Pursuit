"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-error/10 text-error">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-charcoal">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-[10px] text-graphite">Error: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep"
      >
        Try Again
      </button>
    </div>
  );
}
