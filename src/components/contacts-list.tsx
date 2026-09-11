"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getContacts,
  getCompanies,
  addContact,
  updateContact,
  deleteContact,
  addCompany,
  updateCompany,
  deleteCompany,
  type ContactWithCompany,
} from "@/lib/actions/contacts";
import { LoadingScreen } from "@/components/loading-screen";
import { useEscapeKey } from "@/lib/use-escape-key";
import { exportContactsCSV } from "@/lib/csv-export";
import { confirm } from "@/components/confirm-dialog";

type Company = {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  source?: string | null;
};

export function ContactsList() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithCompany | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompanies, setShowCompanies] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEscapeKey(() => {
    if (editingContact) setEditingContact(null);
    else if (showAddModal) setShowAddModal(false);
    else if (editingCompany) setEditingCompany(null);
    else if (showAddCompany) setShowAddCompany(false);
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [c, co] = await Promise.all([getContacts(), getCompanies()]);
    setContacts(c);
    setCompanies(co);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ message: "Delete this contact?", danger: true }))) return;
    try {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Contact deleted");
    } catch {
      toast.error("Failed to delete contact");
    }
  }

  async function handleCompanyAdd(data: {
    name: string;
    website: string;
    industry: string;
    source: string;
  }) {
    await addCompany({
      name: data.name,
      website: data.website || undefined,
      industry: data.industry || undefined,
      source: data.source || undefined,
    });
    await loadData();
    setShowAddCompany(false);
  }

  async function handleCompanyEdit(data: {
    name: string;
    website: string;
    industry: string;
    source: string;
  }) {
    if (!editingCompany) return;
    await updateCompany(editingCompany.id, {
      name: data.name,
      website: data.website || undefined,
      industry: data.industry || undefined,
      source: data.source || undefined,
    });
    setCompanies((prev) => prev.map((c) => (c.id === editingCompany.id ? { ...c, ...data } : c)));
    setEditingCompany(null);
  }

  async function handleCompanyDelete(id: string) {
    if (
      !(await confirm({
        message: "Delete this company? Contacts linked to it will not be deleted.",
        danger: true,
      }))
    )
      return;
    try {
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast.success("Company deleted");
    } catch {
      toast.error("Failed to delete company");
    }
  }

  async function handleAddSave(data: {
    companyId: string;
    name: string;
    role: string;
    email: string;
    linkedinUrl: string;
  }) {
    await addContact({
      companyId: data.companyId,
      name: data.name,
      role: data.role || undefined,
      email: data.email || undefined,
      linkedinUrl: data.linkedinUrl || undefined,
    });
    await loadData();
    setShowAddModal(false);
  }

  async function handleEditSave(data: {
    companyId: string;
    name: string;
    role: string;
    email: string;
    linkedinUrl: string;
  }) {
    if (!editingContact) return;
    await updateContact(editingContact.id, {
      companyId: data.companyId,
      name: data.name,
      role: data.role || undefined,
      email: data.email || undefined,
      linkedinUrl: data.linkedinUrl || undefined,
    });
    setContacts((prev) =>
      prev.map((c) =>
        c.id === editingContact.id
          ? {
              ...c,
              ...data,
              companyName: companies.find((co) => co.id === data.companyId)?.name ?? c.companyName,
            }
          : c
      )
    );
    setEditingContact(null);
  }

  const filtered = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-ink">Contacts</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {contacts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportContactsCSV(contacts)}
            className="rounded-md border border-hairline bg-canvas px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-cloud sm:text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold tracking-wide text-on-primary transition-colors hover:bg-primary-deep sm:px-4 sm:text-sm"
          >
            + Add Contact
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 sm:px-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, company, email, or role..."
          className="w-full rounded-md border border-steel bg-canvas px-3 py-1.5 text-sm text-ink placeholder:text-graphite focus:border-ink focus:outline-none sm:w-80"
        />
      </div>

      <div className="px-4 pb-3 sm:px-6">
        <button
          onClick={() => setShowCompanies(!showCompanies)}
          className="flex items-center gap-2 text-xs font-medium text-graphite hover:text-ink"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${showCompanies ? "rotate-90" : ""}`}
          >
            <path
              d="M4 2L8 6L4 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {companies.length} Companies
        </button>

        {showCompanies && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddCompany(true)}
                className="rounded-md border border-hairline bg-canvas px-3 py-1 text-xs font-medium text-ink hover:bg-cloud"
              >
                + Add Company
              </button>
            </div>
            {companies.map((co) => (
              <div
                key={co.id}
                className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{co.name}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] text-graphite">
                    {co.industry && <span>{co.industry}</span>}
                    {co.website && (
                      <a
                        href={co.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-link"
                      >
                        Website
                      </a>
                    )}
                    {co.source && <span>via {co.source}</span>}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-1">
                  <button
                    onClick={() => setEditingCompany(co)}
                    className="p-1 text-graphite hover:text-primary"
                    title="Edit"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M10.5 1.5L12.5 3.5L4 12H2V10L10.5 1.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleCompanyDelete(co.id)}
                    className="p-1 text-graphite hover:text-error"
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-graphite">
            {contacts.length === 0
              ? "No contacts yet. Add your first contact."
              : "No contacts match your search."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-hairline bg-paper p-4 transition-colors hover:shadow-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-ink">{c.name}</h4>
                    {c.role && (
                      <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-medium text-graphite">
                        {c.role}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-charcoal">{c.companyName}</p>
                  <div className="mt-1 flex items-center gap-3">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-xs text-link hover:text-link-pressed"
                      >
                        {c.email}
                      </a>
                    )}
                    {c.linkedinUrl && (
                      <a
                        href={c.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-link hover:text-link-pressed"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <button
                    onClick={() => setEditingContact(c)}
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
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-graphite hover:text-error"
                    title="Delete"
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
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <ContactModal
          companies={companies}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}

      {editingContact && (
        <ContactModal
          companies={companies}
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSave={handleEditSave}
        />
      )}

      {showAddCompany && (
        <CompanyModal onClose={() => setShowAddCompany(false)} onSave={handleCompanyAdd} />
      )}

      {editingCompany && (
        <CompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSave={handleCompanyEdit}
        />
      )}
    </div>
  );
}

function ContactModal({
  companies,
  contact,
  onClose,
  onSave,
}: {
  companies: Company[];
  contact?: ContactWithCompany;
  onClose: () => void;
  onSave: (data: {
    companyId: string;
    name: string;
    role: string;
    email: string;
    linkedinUrl: string;
  }) => void;
}) {
  const [companyId, setCompanyId] = useState(contact?.companyId ?? companies[0]?.id ?? "");
  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(contact?.linkedinUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !companyId) return;
    setSaving(true);
    try {
      onSave({ companyId, name, role, email, linkedinUrl });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-paper p-4 shadow-modal sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-ink">
          {contact ? "Edit Contact" : "Add Contact"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Company *</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="e.g. Hiring Manager"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="https://linkedin.com/in/..."
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
            disabled={saving || !name.trim() || !companyId}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            {saving ? "Saving..." : contact ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanyModal({
  company,
  onClose,
  onSave,
}: {
  company?: Company;
  onClose: () => void;
  onSave: (data: { name: string; website: string; industry: string; source: string }) => void;
}) {
  const [name, setName] = useState(company?.name ?? "");
  const [website, setWebsite] = useState(company?.website ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? "");
  const [source, setSource] = useState(company?.source ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      onSave({ name, website, industry, source });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-paper p-4 shadow-modal sm:p-6">
        <h3 className="mb-4 text-lg font-medium text-ink">
          {company ? "Edit Company" : "Add Company"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="e.g. Tech, Finance"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              placeholder="e.g. LinkedIn, Referral"
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
            disabled={saving || !name.trim()}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
          >
            {saving ? "Saving..." : company ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
