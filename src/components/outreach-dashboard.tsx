"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getOutreachMessages,
  addOutreachMessage,
  updateOutreachStatus,
  deleteOutreachMessage,
  updateOutreachMessage,
  type OutreachWithRelations,
} from "@/lib/actions/outreach";
import { getApplications, type ApplicationWithRelations } from "@/lib/actions/applications";
import { LoadingScreen } from "@/components/loading-screen";
import { useEscapeKey } from "@/lib/use-escape-key";
import { exportOutreachCSV } from "@/lib/csv-export";
import { confirm } from "@/components/confirm-dialog";

export function OutreachDashboard() {
  const [messages, setMessages] = useState<OutreachWithRelations[]>([]);
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [editingMsg, setEditingMsg] = useState<OutreachWithRelations | null>(null);
  const [filter, setFilter] = useState<"all" | "drafted" | "sent" | "replied">("all");

  useEscapeKey(() => {
    if (editingMsg) setEditingMsg(null);
    else if (showDraftModal) setShowDraftModal(false);
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [m, a] = await Promise.all([getOutreachMessages(), getApplications()]);
    setMessages(m);
    setApplications(a);
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateOutreachStatus(id, status);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, status, sentAt: status === "sent" ? new Date().toISOString() : m.sentAt }
            : m
        )
      );
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ message: "Delete this message?", danger: true }))) return;
    try {
      await deleteOutreachMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  }

  async function handleSendEmail(msg: OutreachWithRelations) {
    if (!msg.contactEmail) {
      toast.error("No email address for this contact");
      return;
    }
    if (!(await confirm({ message: `Send email to ${msg.contactEmail}?` }))) return;

    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: msg.contactEmail,
          subject: msg.subject || `Following up - ${msg.companyName}`,
          body: msg.body,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Send failed");
      }

      await handleStatusChange(msg.id, "sent");
      toast.success("Email sent successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    }
  }

  async function handleEditSave(data: { channel: string; subject: string; body: string }) {
    if (!editingMsg) return;
    await updateOutreachMessage(editingMsg.id, data);
    setMessages((prev) => prev.map((m) => (m.id === editingMsg.id ? { ...m, ...data } : m)));
    setEditingMsg(null);
  }

  const filtered = messages.filter((m) => (filter === "all" ? true : m.status === filter));
  const drafted = messages.filter((m) => m.status === "drafted").length;
  const sent = messages.filter((m) => m.status === "sent").length;
  const replied = messages.filter((m) => m.status === "replied").length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-ink">Outreach</h2>
          <div className="flex gap-2 text-xs text-graphite">
            <span>{drafted} drafted</span>
            <span>&middot;</span>
            <span>{sent} sent</span>
            <span>&middot;</span>
            <span>{replied} replied</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportOutreachCSV(messages)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-cloud sm:text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowDraftModal(true)}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold tracking-wide text-on-primary transition-colors hover:bg-primary-deep sm:px-4 sm:text-sm"
          >
            + Draft Message
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
        {(["all", "drafted", "sent", "replied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f ? "bg-ink text-on-primary" : "bg-cloud text-charcoal hover:bg-fog"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cloud text-graphite">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink">
              {filter !== "all" ? `No ${filter} messages` : "No outreach messages yet"}
            </p>
            <p className="mt-1 text-xs text-charcoal">
              {filter !== "all"
                ? "Try changing your filter to see more messages."
                : "Draft messages to track your outreach efforts."}
            </p>
            {filter === "all" && (
              <button
                onClick={() => setShowDraftModal(true)}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-deep"
              >
                + Draft Message
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-lg border border-hairline bg-paper p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          m.status === "drafted"
                            ? "bg-cloud text-charcoal"
                            : m.status === "sent"
                              ? "bg-primary/10 text-primary"
                              : "bg-storm-mist/20 text-storm-deep"
                        }`}
                      >
                        {m.status}
                      </span>
                      <span className="rounded-full bg-fog px-2 py-0.5 text-[10px] font-medium text-graphite">
                        {m.channel}
                      </span>
                      <span className="text-xs text-graphite">
                        {m.contactName} @ {m.companyName}
                      </span>
                    </div>
                    {m.subject && <p className="mt-1 text-sm font-medium text-ink">{m.subject}</p>}
                    <p className="mt-1 line-clamp-2 text-xs text-charcoal">{m.body}</p>
                    {m.sentAt && (
                      <p className="mt-1 text-[10px] text-graphite">
                        Sent{" "}
                        {new Date(m.sentAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    {m.status === "drafted" && (
                      <>
                        <button
                          onClick={() => setEditingMsg(m)}
                          className="text-graphite hover:text-primary"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M10.5 1.5L12.5 3.5L4 12H2V10L10.5 1.5Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {m.channel === "email" && m.contactEmail && (
                          <button
                            onClick={() => handleSendEmail(m)}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Send Email
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(m.id, "sent")}
                          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-on-primary hover:bg-primary-deep"
                        >
                          Mark Sent
                        </button>
                      </>
                    )}
                    {m.status === "sent" && (
                      <button
                        onClick={() => handleStatusChange(m.id, "replied")}
                        className="rounded-md bg-storm-deep px-3 py-1 text-xs font-medium text-on-primary hover:bg-storm-sea"
                      >
                        Mark Replied
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-graphite hover:text-error"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M1 1L13 13M1 13L13 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDraftModal && (
        <DraftModal
          applications={applications}
          onClose={() => setShowDraftModal(false)}
          onAdd={async (data) => {
            await addOutreachMessage(data);
            await loadData();
            setShowDraftModal(false);
          }}
        />
      )}

      {editingMsg && (
        <EditModal
          message={editingMsg}
          onClose={() => setEditingMsg(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

function DraftModal({
  applications,
  onClose,
  onAdd,
}: {
  applications: ApplicationWithRelations[];
  onClose: () => void;
  onAdd: (data: {
    applicationId: string;
    contactId: string;
    channel: string;
    subject?: string;
    body: string;
  }) => Promise<void>;
}) {
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selectedApp = applications.find((a) => a.id === applicationId);

  async function generateDraft() {
    if (!selectedApp) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedApp.company?.name ?? "",
          jobTitle: selectedApp.jobTitle,
          contactName: selectedApp.contact?.name || "",
          channel,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setSubject(data.subject || "");
      setBody(data.body || "");
    } catch {
      toast.error("AI generation failed. Please write manually.");
    } finally {
      setGenerating(false);
    }
  }

  const contactId = selectedApp?.contactId ?? selectedApp?.contact?.id ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-hairline bg-paper p-4 shadow-modal sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-ink">Draft Outreach Message</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">Application</label>
              <select
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              >
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.jobTitle} @ {a.company?.name ?? "Unknown"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          {channel === "email" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="Subject line..."
              />
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-graphite">Message Body</label>
              <button
                onClick={generateDraft}
                disabled={generating}
                className="text-xs text-primary hover:text-primary-deep disabled:text-graphite"
              >
                {generating ? "Generating..." : "AI Generate Draft"}
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              rows={8}
              placeholder="Write your message..."
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
              if (applicationId && contactId && body) {
                setSaving(true);
                try {
                  await onAdd({ applicationId, contactId, channel, subject, body });
                } finally {
                  setSaving(false);
                }
              }
            }}
            disabled={!applicationId || !contactId || !body || saving}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  message,
  onClose,
  onSave,
}: {
  message: OutreachWithRelations;
  onClose: () => void;
  onSave: (data: { channel: string; subject: string; body: string }) => void;
}) {
  const [channel, setChannel] = useState(message.channel);
  const [subject, setSubject] = useState(message.subject ?? "");
  const [body, setBody] = useState(message.body);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      onSave({ channel, subject: subject || (undefined as unknown as string), body });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-hairline bg-paper p-4 shadow-modal sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-ink">Edit Message</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
          {channel === "email" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="Subject line..."
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Message Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              rows={8}
              placeholder="Write your message..."
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
            onClick={handleSave}
            disabled={saving || !body.trim()}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
