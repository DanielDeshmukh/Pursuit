"use client";

import { useState } from "react";
import { scrapeJobUrl, type ScrapedJob } from "@/lib/actions/scrape-job";
import { addApplication } from "@/lib/actions/applications";

type ImportResult = {
  url: string;
  status: "success" | "error";
  data?: ScrapedJob;
  error?: string;
};

export function JobImporter() {
  const [urls, setUrls] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  async function handleImport() {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    if (urlList.length === 0) return;

    setImporting(true);
    setResults([]);

    const importResults: ImportResult[] = [];

    for (const url of urlList) {
      try {
        const data = await scrapeJobUrl(url);

        await addApplication({
          jobTitle: data.jobTitle,
          companyName: data.companyName,
          jobUrl: url,
          source: data.source,
          salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
          salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        });

        importResults.push({ url, status: "success", data });
      } catch (e) {
        importResults.push({
          url,
          status: "error",
          error: e instanceof Error ? e.message : "Failed to import",
        });
      }
    }

    setResults(importResults);
    setImporting(false);
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <h2 className="mb-2 text-lg font-medium text-ink">Import Jobs</h2>
      <p className="mb-6 text-sm text-graphite">
        Paste job listing URLs (one per line) to automatically import them into your tracker.
      </p>

      <div className="max-w-2xl">
        <div className="rounded-xl border border-hairline bg-paper p-4">
          <label className="mb-2 block text-xs font-medium text-graphite">
            Job URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            rows={8}
            placeholder={`https://linkedin.com/jobs/view/...\nhttps://indeed.com/viewjob?...\nhttps://greenhouse.io/...`}
            disabled={importing}
          />

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-graphite">
              {urls.split("\n").filter((u) => u.trim().startsWith("http")).length} URL(s) detected
            </span>
            <button
              onClick={handleImport}
              disabled={importing || !urls.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
            >
              {importing ? "Importing..." : "Import All"}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-4 text-sm">
              <span className="text-green-500">{successCount} imported</span>
              {errorCount > 0 && <span className="text-error">{errorCount} failed</span>}
            </div>

            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    r.status === "success"
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-error/20 bg-error/5"
                  }`}
                >
                  <p className="truncate text-xs text-graphite">{r.url}</p>
                  {r.status === "success" && r.data && (
                    <p className="mt-1 text-sm font-medium text-ink">
                      {r.data.jobTitle} @ {r.data.companyName}
                    </p>
                  )}
                  {r.status === "error" && <p className="mt-1 text-sm text-error">{r.error}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
