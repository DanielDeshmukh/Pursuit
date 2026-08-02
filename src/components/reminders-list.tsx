"use client";

import { useState, useEffect } from "react";
import {
  getReminders,
  addReminder,
  toggleReminder,
  deleteReminder,
  updateReminder,
  type ReminderWithApp,
} from "@/lib/actions/reminders";
import { getApplications, type ApplicationWithRelations } from "@/lib/actions/applications";
import { LoadingScreen } from "@/components/loading-screen";

export function RemindersList() {
  const [reminders, setReminders] = useState<ReminderWithApp[]>([]);
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderWithApp | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [r, a] = await Promise.all([getReminders(), getApplications()]);
    setReminders(r);
    setApplications(a);
    setLoading(false);
  }

  async function handleToggle(id: string, done: boolean) {
    await toggleReminder(id, done);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done } : r))
    );
  }

  async function handleDelete(id: string) {
    await deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleEditSave(data: {
    applicationId: string;
    type: string;
    dueAt: string;
  }) {
    if (!editingReminder) return;
    await updateReminder(editingReminder.id, data);
    setReminders((prev) =>
      prev.map((r) =>
        r.id === editingReminder.id
          ? { ...r, ...data }
          : r
      )
    );
    setEditingReminder(null);
  }

  const filtered = reminders.filter((r) => {
    if (filter === "pending") return !r.done;
    if (filter === "done") return r.done;
    return true;
  });

  const pendingCount = reminders.filter((r) => !r.done).length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-ink">Reminders</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {pendingCount} pending
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold tracking-wide text-on-primary transition-colors hover:bg-primary-deep"
        >
          + Add Reminder
        </button>
      </div>

      <div className="flex gap-2 px-6 pb-3">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-ink text-on-primary"
                : "bg-cloud text-charcoal hover:bg-fog"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-graphite">
            No reminders {filter !== "all" ? `(${filter})` : ""}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const isOverdue =
                !r.done && new Date(r.dueAt) < new Date();
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    r.done
                      ? "border-hairline bg-cloud/50 opacity-60"
                      : isOverdue
                        ? "border-error/30 bg-error/5"
                        : "border-hairline bg-paper"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(r.id, !r.done)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      r.done
                        ? "border-primary bg-primary text-on-primary"
                        : "border-steel hover:border-primary"
                    }`}
                  >
                    {r.done && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          r.type === "follow_up"
                            ? "bg-primary/10 text-primary"
                            : r.type === "interview_prep"
                              ? "bg-storm-mist/20 text-storm-deep"
                              : "bg-bloom-rose/30 text-bloom-deep"
                        }`}
                      >
                        {r.type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-graphite">
                        {r.jobTitle} @ {r.companyName}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 text-xs ${
                        isOverdue ? "font-medium text-error" : "text-graphite"
                      }`}
                    >
                      Due:{" "}
                      {new Date(r.dueAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {isOverdue && " (overdue)"}
                    </p>
                  </div>

                  <button
                    onClick={() => setEditingReminder(r)}
                    className="shrink-0 text-graphite hover:text-primary"
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 1.5L12.5 3.5L4 12H2V10L10.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 text-graphite hover:text-error"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M1 1L13 13M1 13L13 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddReminderModal
          applications={applications}
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await addReminder(data);
            await loadData();
            setShowAddModal(false);
          }}
        />
      )}

      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          applications={applications}
          onClose={() => setEditingReminder(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

function AddReminderModal({
  applications,
  onClose,
  onAdd,
}: {
  applications: ApplicationWithRelations[];
  onClose: () => void;
  onAdd: (data: {
    applicationId: string;
    type: string;
    dueAt: string;
  }) => void;
}) {
  const [applicationId, setApplicationId] = useState(
    applications[0]?.id ?? ""
  );
  const [type, setType] = useState("follow_up");
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };
  const [dueAt, setDueAt] = useState(getDefaultDate);

  const types = [
    { value: "follow_up", label: "Follow-up" },
    { value: "interview_prep", label: "Interview Prep" },
    { value: "thank_you", label: "Thank You Note" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-paper p-6 shadow-modal">
        <h3 className="mb-4 text-lg font-medium text-ink">Add Reminder</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Application
            </label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.jobTitle} @ {a.company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Due Date
            </label>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-hairline bg-canvas py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (applicationId) {
                onAdd({
                  applicationId,
                  type,
                  dueAt: new Date(dueAt).toISOString(),
                });
              }
            }}
            disabled={!applicationId}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function EditReminderModal({
  reminder,
  applications,
  onClose,
  onSave,
}: {
  reminder: ReminderWithApp;
  applications: ApplicationWithRelations[];
  onClose: () => void;
  onSave: (data: { applicationId: string; type: string; dueAt: string }) => void;
}) {
  const [applicationId, setApplicationId] = useState(reminder.applicationId);
  const [type, setType] = useState(reminder.type);
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date(reminder.dueAt);
    return d.toISOString().split("T")[0];
  });
  const [saving, setSaving] = useState(false);

  const types = [
    { value: "follow_up", label: "Follow-up" },
    { value: "interview_prep", label: "Interview Prep" },
    { value: "thank_you", label: "Thank You Note" },
  ];

  async function handleSave() {
    if (!applicationId) return;
    setSaving(true);
    try {
      onSave({
        applicationId,
        type,
        dueAt: new Date(dueAt).toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-paper p-6 shadow-modal">
        <h3 className="mb-4 text-lg font-medium text-ink">Edit Reminder</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Application
            </label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.jobTitle} @ {a.company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">
              Due Date
            </label>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-hairline bg-canvas py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !applicationId}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
