"use client";

import { useState } from "react";

type InterviewPrepData = {
  questions: { question: string; answer: string; tip: string }[];
  questionsToAsk: { question: string; why: string }[];
  talkingPoints: string[];
  companyResearch: string[];
  starExamples: { situation: string; task: string; action: string; result: string }[];
};

export function InterviewPrep({
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
  const [data, setData] = useState<InterviewPrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "ask" | "talking" | "star">("questions");

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interview/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          companyName,
          jobDescription,
          resumeText,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const result = await res.json();
      setData(result);
    } catch {
      setError("Failed to generate interview prep. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "questions" as const, label: "Questions" },
    { id: "ask" as const, label: "To Ask" },
    { id: "talking" as const, label: "Talking Points" },
    { id: "star" as const, label: "STAR" },
  ];

  return (
    <div>
      {!data && !loading && (
        <button
          onClick={handleGenerate}
          className="w-full rounded-md border border-storm-deep/30 bg-storm-deep/5 px-3 py-2 text-sm font-medium text-storm-deep transition-colors hover:bg-storm-deep/10"
        >
          🎯 Generate Interview Prep
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-graphite">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating interview prep...
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      {data && (
        <div>
          <div className="mb-3 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === t.id
                    ? "bg-ink text-on-primary"
                    : "text-graphite hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {activeTab === "questions" && (
              <div className="space-y-3">
                {data.questions.map((q, i) => (
                  <div key={i} className="rounded-lg border border-hairline bg-surface p-3">
                    <p className="text-sm font-medium text-ink">{q.question}</p>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{q.answer}</p>
                    {q.tip && (
                      <p className="mt-1 text-[10px] text-primary">💡 {q.tip}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "ask" && (
              <div className="space-y-2">
                {data.questionsToAsk.map((q, i) => (
                  <div key={i} className="rounded-lg border border-hairline bg-surface p-3">
                    <p className="text-sm font-medium text-ink">{q.question}</p>
                    <p className="mt-1 text-xs text-graphite">{q.why}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "talking" && (
              <div className="space-y-2">
                <div className="rounded-lg border border-hairline bg-surface p-3">
                  {data.talkingPoints.map((tp, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <p className="text-xs text-zinc-400">{tp}</p>
                    </div>
                  ))}
                </div>
                {data.companyResearch.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-graphite mt-2">Company Research</p>
                    <div className="rounded-lg border border-hairline bg-surface p-3">
                      {data.companyResearch.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-storm-deep" />
                          <p className="text-xs text-zinc-400">{r}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "star" && (
              <div className="space-y-3">
                {data.starExamples.map((ex, i) => (
                  <div key={i} className="rounded-lg border border-hairline bg-surface p-3 space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-primary">Situation</span>
                      <p className="text-xs text-zinc-400">{ex.situation}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-primary">Task</span>
                      <p className="text-xs text-zinc-400">{ex.task}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-primary">Action</span>
                      <p className="text-xs text-zinc-400">{ex.action}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-primary">Result</span>
                      <p className="text-xs text-zinc-400">{ex.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setData(null)}
            className="mt-3 text-xs text-graphite hover:text-ink"
          >
            Re-generate
          </button>
        </div>
      )}
    </div>
  );
}
