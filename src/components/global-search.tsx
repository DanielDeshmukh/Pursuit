"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { globalSearch, type SearchResult } from "@/lib/actions/search";

const typeIcons: Record<SearchResult["type"], string> = {
  application: "📋",
  contact: "👤",
  company: "🏢",
  outreach: "✉️",
  reminder: "⏰",
};

const typeLabels: Record<SearchResult["type"], string> = {
  application: "Application",
  contact: "Contact",
  company: "Company",
  outreach: "Outreach",
  reminder: "Reminder",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const prevOpen = useRef(open);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) {
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      const r = await globalSearch(query);
      setResults(r);
      setSelectedIndex(0);
      setLoading(false);
    }, 200);

    return () => clearTimeout(debounce);
  }, [query]);

  const navigate = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      router.push(result.url);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-hairline bg-paper shadow-modal">
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-graphite"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search applications, contacts, companies..."
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-graphite"
          />
          <kbd className="rounded border border-hairline bg-surface px-1.5 py-0.5 text-[10px] text-graphite">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-graphite">Searching...</div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-graphite">No results found</div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => navigate(result)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? "bg-primary/10" : "hover:bg-surface"
                  }`}
                >
                  <span className="text-base">{typeIcons[result.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{result.title}</p>
                    <p className="truncate text-xs text-graphite">{result.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-graphite">
                    {typeLabels[result.type]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="px-4 py-8 text-center text-xs text-graphite">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
