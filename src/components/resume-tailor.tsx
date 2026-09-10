"use client";

import { useState } from "react";

type TailoredResult = {
  summary: string;
  skills: string[];
  highlights: { company: string; role: string; bullets: string[] }[];
  coverLetter: string;
};

export function ResumeTailor({
  jobTitle,
  companyName,
  jobDescription,
  resumeText,
}: {
  jobTitle: string;
  companyName: string;
  jobDescription?: string | null;
  resumeText?: string | null;
}) {
  const [result, setResult] = useState<TailoredResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  async function handleTailor() {
    if (!resumeText || !jobDescription) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle,
          companyName,
        }),
      });

      if (!res.ok) throw new Error("Tailoring failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to tailor resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!resumeText || !jobDescription) {
    return (
      <p className="text-xs text-graphite">
        Add a job description and resume to enable tailoring.
      </p>
    );
  }

  return (
    <div>
      {!result && !loading && (
        <button
          onClick={handleTailor}
          className="w-full rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          ✨ Tailor Resume for This Role
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-graphite">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Tailoring your resume...
        </div>
      )}

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          <div>
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tailored Summary
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
          </div>

          {result.skills.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Key Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.skills.map((s, i) => (
                  <span key={i} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.highlights.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Experience Highlights
              </h4>
              <div className="space-y-2">
                {result.highlights.map((h, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-zinc-400">
                      {h.role} {h.company && `@ ${h.company}`}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {h.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-zinc-500">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.coverLetter && (
            <div>
              <button
                onClick={() => setShowCoverLetter(!showCoverLetter)}
                className="mb-1 text-xs text-primary hover:text-primary-deep"
              >
                {showCoverLetter ? "Hide" : "Show"} Cover Letter
              </button>
              {showCoverLetter && (
                <div className="rounded-lg border border-hairline bg-surface p-3">
                  <p className="whitespace-pre-wrap text-xs text-zinc-400 leading-relaxed">
                    {result.coverLetter}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="text-xs text-graphite hover:text-ink"
          >
            Re-generate
          </button>
        </div>
      )}
    </div>
  );
}
