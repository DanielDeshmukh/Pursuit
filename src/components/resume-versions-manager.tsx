"use client";

import { useState, useEffect } from "react";
import {
  getResumeVersions,
  addResumeVersion,
  deleteResumeVersion,
  type ResumeVersion,
} from "@/lib/actions/resume-versions";
import { useEscapeKey } from "@/lib/use-escape-key";
import { confirm } from "@/components/confirm-dialog";

export function ResumeVersionsManager() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEscapeKey(() => {
    if (showAdd) setShowAdd(false);
  });

  useEffect(() => {
    async function load() {
      const v = await getResumeVersions();
      setVersions(v);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd(data: { name: string; tailoringNotes: string }) {
    const v = await addResumeVersion({
      name: data.name,
      tailoringNotes: data.tailoringNotes || undefined,
    });
    setVersions((prev) => [...prev, v]);
    setShowAdd(false);
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ message: "Delete this resume version?", danger: true }))) return;
    await deleteResumeVersion(id);
    setVersions((prev) => prev.filter((v) => v.id !== id));
  }

  if (loading) {
    return <div className="text-sm text-graphite">Loading versions...</div>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">Resume Versions</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs text-primary hover:text-primary-deep"
        >
          + Add Version
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-graphite">
          No resume versions yet. Add versions to track which resume you sent to each company.
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{v.name}</p>
                {v.tailoringNotes && (
                  <p className="mt-0.5 text-[10px] text-graphite">{v.tailoringNotes}</p>
                )}
                <p className="mt-0.5 text-[10px] text-graphite">
                  Added {new Date(v.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(v.id)}
                className="ml-2 p-1 text-graphite hover:text-error"
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddVersionModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}

function AddVersionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { name: string; tailoringNotes: string }) => void;
}) {
  const [name, setName] = useState("");
  const [tailoringNotes, setTailoringNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-hairline bg-paper p-4 shadow-modal sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-ink">Add Resume Version</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="e.g. v2.1 - Backend Focus"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Tailoring Notes</label>
            <textarea
              value={tailoringNotes}
              onChange={(e) => setTailoringNotes(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              rows={3}
              placeholder="e.g. Emphasized Python projects, removed frontend skills"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-hairline bg-canvas py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onAdd({ name: name.trim(), tailoringNotes });
              }
            }}
            disabled={!name.trim()}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
