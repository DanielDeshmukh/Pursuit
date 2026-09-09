function escapeCSV(cell: string | number | null | undefined): string {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}

function downloadCSV(rows: (string | number | null | undefined)[][], filename: string) {
  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportApplicationsCSV(
  apps: {
    jobTitle: string;
    company: { name: string };
    status: string;
    source?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    jobUrl?: string | null;
    notes?: string | null;
    appliedAt?: string | null;
  }[]
) {
  const headers = ["Job Title", "Company", "Status", "Source", "Salary Min", "Salary Max", "Job URL", "Notes", "Applied At"];
  const rows = apps.map((app) => [
    app.jobTitle,
    app.company.name,
    app.status,
    app.source ?? "",
    app.salaryMin ?? "",
    app.salaryMax ?? "",
    app.jobUrl ?? "",
    app.notes ?? "",
    app.appliedAt ?? "",
  ]);
  downloadCSV([headers, ...rows], "pursuit-applications");
}

export function exportContactsCSV(
  contacts: {
    name: string;
    role?: string | null;
    email?: string | null;
    linkedinUrl?: string | null;
    companyName: string;
    lastContactedAt?: string | null;
  }[]
) {
  const headers = ["Name", "Role", "Email", "LinkedIn", "Company", "Last Contacted"];
  const rows = contacts.map((c) => [
    c.name,
    c.role ?? "",
    c.email ?? "",
    c.linkedinUrl ?? "",
    c.companyName,
    c.lastContactedAt ?? "",
  ]);
  downloadCSV([headers, ...rows], "pursuit-contacts");
}

export function exportOutreachCSV(
  messages: {
    contactName: string;
    companyName: string;
    channel: string;
    subject?: string | null;
    body: string;
    status: string;
    sentAt?: string | null;
  }[]
) {
  const headers = ["Contact", "Company", "Channel", "Subject", "Body", "Status", "Sent At"];
  const rows = messages.map((m) => [
    m.contactName,
    m.companyName,
    m.channel,
    m.subject ?? "",
    m.body,
    m.status,
    m.sentAt ?? "",
  ]);
  downloadCSV([headers, ...rows], "pursuit-outreach");
}
