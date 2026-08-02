"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  getApplications,
  updateApplicationStatus,
  addApplication,
  deleteApplication,
  updateApplication,
} from "@/lib/actions/applications";
import { STATUS_COLUMNS, type ApplicationWithRelations } from "@/lib/types";
import { LoadingScreen } from "@/components/loading-screen";

export function KanbanBoard() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] =
    useState<ApplicationWithRelations | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const sources = [
    "ALL",
    "LinkedIn",
    "Naukri",
    "Referral",
    "Walk-in",
    "Company Website",
    "Indeed",
    "Other",
  ];

  function exportCSV() {
    const headers = [
      "Job Title",
      "Company",
      "Status",
      "Source",
      "Salary Min",
      "Salary Max",
      "Job URL",
      "Notes",
      "Applied At",
    ];
    const rows = applications.map((app) => [
      app.jobTitle,
      app.company.name,
      app.status,
      app.source ?? "",
      app.salaryMin != null ? String(app.salaryMin) : "",
      app.salaryMax != null ? String(app.salaryMax) : "",
      app.jobUrl ?? "",
      app.notes ?? "",
      app.appliedAt ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pursuit-applications-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    const apps = await getApplications();
    setApplications(apps);
    setLoading(false);
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const newStatus = result.destination.droppableId;
    const appId = result.draggableId;

    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: newStatus } : app
      )
    );

    try {
      await updateApplicationStatus(appId, newStatus);
    } catch {
      await loadApplications();
    }
  }

  function getAppsByStatus(status: string) {
    return applications.filter((app) => {
      const matchesSource =
        sourceFilter === "ALL" || app.source === sourceFilter;
      const matchesSearch =
        !searchQuery ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.name.toLowerCase().includes(searchQuery.toLowerCase());
      return app.status === status && matchesSource && matchesSearch;
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-medium text-ink">
          Applications ({applications.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="rounded-md border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold tracking-wide text-on-primary transition-colors hover:bg-primary-deep"
          >
            + Add Application
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or company..."
          className="w-64 rounded-md border border-steel bg-canvas px-3 py-1.5 text-sm text-ink placeholder:text-graphite focus:border-ink focus:outline-none"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-md border border-steel bg-canvas px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Sources" : s}
            </option>
          ))}
        </select>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4">
          {STATUS_COLUMNS.map((col) => {
            const apps = getAppsByStatus(col.id);
            return (
              <div
                key={col.id}
                className="flex w-64 min-w-64 flex-col rounded-xl bg-cloud/50"
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-charcoal">
                    {col.label}
                  </h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-fog px-1.5 text-[10px] font-bold text-graphite">
                    {apps.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`mx-1.5 mb-1.5 flex max-h-[calc(100vh-180px)] flex-col gap-2 overflow-y-auto rounded-lg p-1.5 transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-primary/5 ring-2 ring-primary/20"
                          : ""
                      }`}
                    >
                      {apps.map((app, index) => (
                        <Draggable
                          key={app.id}
                          draggableId={app.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedApp(app)}
                              className={`cursor-pointer rounded-lg border border-hairline bg-paper p-3 transition-all hover:border-hairline-strong hover:shadow-card ${
                                snapshot.isDragging
                                  ? "shadow-modal rotate-1"
                                  : ""
                              }`}
                            >
                              <h4 className="text-sm font-medium text-ink">
                                {app.jobTitle}
                              </h4>
                              <p className="mt-0.5 text-xs text-charcoal">
                                {app.company.name}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                {app.source && (
                                  <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-medium text-graphite">
                                    {app.source}
                                  </span>
                                )}
                                {(app.salaryMin != null || app.salaryMax != null) && (
                                  <span className="text-[10px] text-graphite">
                                    {app.salaryMin ?? "?"}–{app.salaryMax ?? "?"}
                                  </span>
                                )}
                              </div>
                              {app.jobUrl && (
                                <a
                                  href={app.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 inline-block text-xs text-link hover:text-link-pressed"
                                >
                                  View Job &rarr;
                                </a>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedApp && (
        <DetailPanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onDelete={async () => {
            if (!confirm("Delete this application?")) return;
            try {
              await deleteApplication(selectedApp.id);
              setApplications((prev) =>
                prev.filter((a) => a.id !== selectedApp.id)
              );
              setSelectedApp(null);
            } catch {
              alert("Failed to delete application");
            }
          }}
          onUpdate={(updated) => {
            setApplications((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
            setSelectedApp(updated);
          }}
        />
      )}

      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            try {
              await addApplication(data);
              await loadApplications();
              setShowAddModal(false);
            } catch {
              alert("Failed to add application");
            }
          }}
        />
      )}
    </div>
  );
}

function DetailPanel({
  app,
  onClose,
  onDelete,
  onUpdate,
}: {
  app: ApplicationWithRelations;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (updated: ApplicationWithRelations) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    jobTitle: app.jobTitle,
    jobUrl: app.jobUrl ?? "",
    salaryMin: app.salaryMin != null ? String(app.salaryMin) : "",
    salaryMax: app.salaryMax != null ? String(app.salaryMax) : "",
    source: app.source ?? "",
    notes: app.notes ?? "",
    resumeVersionUsed: app.resumeVersionUsed ?? "",
  });

  const sources = [
    "LinkedIn",
    "Naukri",
    "Referral",
    "Walk-in",
    "Company Website",
    "Indeed",
    "Other",
  ];

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.jobTitle.trim()) return;
    setSaving(true);
    try {
      await updateApplication(app.id, {
        jobTitle: form.jobTitle,
        jobUrl: form.jobUrl || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        source: form.source || undefined,
        notes: form.notes || undefined,
        resumeVersionUsed: form.resumeVersionUsed || undefined,
      });
      onUpdate({
        ...app,
        jobTitle: form.jobTitle,
        jobUrl: form.jobUrl || null,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        source: form.source || null,
        notes: form.notes || null,
        resumeVersionUsed: form.resumeVersionUsed || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      jobTitle: app.jobTitle,
      jobUrl: app.jobUrl ?? "",
      salaryMin: app.salaryMin != null ? String(app.salaryMin) : "",
      salaryMax: app.salaryMax != null ? String(app.salaryMax) : "",
      source: app.source ?? "",
      notes: app.notes ?? "",
      resumeVersionUsed: app.resumeVersionUsed ?? "",
    });
    setEditing(false);
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-hairline bg-paper shadow-modal">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h3 className="font-medium text-ink">Application Details</h3>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-hairline bg-canvas px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-cloud"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-charcoal hover:text-ink">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => handleChange("jobTitle", e.target.value)}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">
                    Job URL
                  </label>
                  <input
                    type="url"
                    value={form.jobUrl}
                    onChange={(e) => handleChange("jobUrl", e.target.value)}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-graphite">
                      Salary Min
                    </label>
                    <input
                      type="text"
                      value={form.salaryMin}
                      onChange={(e) => handleChange("salaryMin", e.target.value)}
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                      placeholder="e.g. 80000"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-graphite">
                      Salary Max
                    </label>
                    <input
                      type="text"
                      value={form.salaryMax}
                      onChange={(e) => handleChange("salaryMax", e.target.value)}
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                      placeholder="e.g. 120000"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">
                    Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => handleChange("source", e.target.value)}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">Select source...</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">
                    Resume Version
                  </label>
                  <input
                    type="text"
                    value={form.resumeVersionUsed}
                    onChange={(e) =>
                      handleChange("resumeVersionUsed", e.target.value)
                    }
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder="e.g. v2.1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    rows={3}
                    placeholder="Any notes..."
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-graphite">
                    Job Title
                  </label>
                  <p className="text-sm text-ink">{app.jobTitle}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite">
                    Company
                  </label>
                  <p className="text-sm text-ink">{app.company.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-graphite">
                    Status
                  </label>
                  <p className="text-sm text-ink">{app.status}</p>
                </div>
                {app.source && (
                  <div>
                    <label className="text-xs font-medium text-graphite">
                      Source
                    </label>
                    <p className="text-sm text-ink">{app.source}</p>
                  </div>
                )}
                {(app.salaryMin != null || app.salaryMax != null) && (
                  <div>
                    <label className="text-xs font-medium text-graphite">
                      Salary Range
                    </label>
                    <p className="text-sm text-ink">
                      {app.salaryMin != null && app.salaryMax != null
                        ? `${app.salaryMin} – ${app.salaryMax}`
                        : app.salaryMin ?? app.salaryMax}
                    </p>
                  </div>
                )}
                {app.jobUrl && (
                  <div>
                    <label className="text-xs font-medium text-graphite">
                      Job URL
                    </label>
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-link hover:text-link-pressed"
                    >
                      {app.jobUrl}
                    </a>
                  </div>
                )}
                {app.resumeVersionUsed && (
                  <div>
                    <label className="text-xs font-medium text-graphite">
                      Resume Version
                    </label>
                    <p className="text-sm text-ink">
                      {app.resumeVersionUsed}
                    </p>
                  </div>
                )}
                {app.notes && (
                  <div>
                    <label className="text-xs font-medium text-graphite">
                      Notes
                    </label>
                    <p className="text-sm text-ink">{app.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t border-hairline p-4">
          {editing ? (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-md border border-hairline bg-canvas py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.jobTitle.trim()}
                className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={onDelete}
              className="w-full rounded-md border border-error bg-canvas py-2 text-sm font-semibold text-error transition-colors hover:bg-error hover:text-on-primary"
            >
              Delete Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: {
    jobTitle: string;
    companyName: string;
    jobUrl?: string;
    salaryMin?: string;
    salaryMax?: string;
    source?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const sources = [
    "LinkedIn",
    "Naukri",
    "Referral",
    "Walk-in",
    "Company Website",
    "Indeed",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-hairline bg-paper p-6 shadow-modal">
        <h3 className="mb-4 text-lg font-medium text-ink">
          Add Application
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">
                Company *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Job URL
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">
                Salary Min
              </label>
              <input
                type="text"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="e.g. 80000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">
                Salary Max
              </label>
              <input
                type="text"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="e.g. 120000"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="">Select source...</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              rows={2}
              placeholder="Any notes..."
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
            onClick={async () => {
              if (jobTitle && companyName) {
                setSaving(true);
                try {
                  await onAdd({
                    jobTitle,
                    companyName,
                    jobUrl,
                    salaryMin: salaryMin ? Number(salaryMin) : undefined,
                    salaryMax: salaryMax ? Number(salaryMax) : undefined,
                    source,
                    notes,
                  });
                } finally {
                  setSaving(false);
                }
              }
            }}
            disabled={!jobTitle || !companyName || saving}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
