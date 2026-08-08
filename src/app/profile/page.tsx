"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getProfile, upsertProfile } from "@/lib/actions/profile";
import Badge from "@/components/badge";
import BadgeModal from "@/components/badge-modal";
import { getBadgeData, type BadgeData } from "@/lib/actions/badge";

type Profile = Record<string, string | null>;
type WorkEntry = { company: string; role: string; startDate: string; endDate: string; location: string; bullets: string[] };
type ProjectEntry = { name: string; description: string; tech: string; bullets: string[] };

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name", lastName: "Last Name", email: "Email",
  phone: "Phone", city: "City", country: "Country",
  linkedinUrl: "LinkedIn", githubUrl: "GitHub", portfolioUrl: "Portfolio",
  currentTitle: "Current Title", currentCompany: "Current Company",
  yearsExperience: "Years of Experience", education: "Education",
  skills: "Skills", workAuthorization: "Work Authorization",
  salaryExpectation: "Salary Expectation",
};

const EDITABLE_KEYS = [
  "firstName", "lastName", "email", "phone", "city", "country",
  "linkedinUrl", "githubUrl", "portfolioUrl", "currentTitle", "currentCompany",
  "yearsExperience", "education", "skills", "workAuthorization",
  "salaryExpectation",
];

function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

function emptyWork(): WorkEntry {
  return { company: "", role: "", startDate: "", endDate: "", location: "", bullets: [""] };
}

function emptyProject(): ProjectEntry {
  return { name: "", description: "", tech: "", bullets: [""] };
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-green-500">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .78 0 1.73v20.53C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}



export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<Profile | null>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Profile>({});
  const [original, setOriginal] = useState<Profile>({});
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([]);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showBadgeView, setShowBadgeView] = useState(false);
  const [badgeRefreshKey, setBadgeRefreshKey] = useState(0);

  useEffect(() => {
    getProfile().then((raw) => {
      if (raw) {
        const p = raw as unknown as Profile;
        setForm(p);
        setOriginal(p);
        setPhoto(p.photo ?? null);
        setWorkEntries(parseJSON<WorkEntry[]>(p.workExperience, []));
        setProjectEntries(parseJSON<ProjectEntry[]>(p.projects, []));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getBadgeData().then(setBadgeData);
  }, [badgeRefreshKey]);

  function setField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function updateWork(idx: number, key: keyof WorkEntry, val: string | string[]) {
    setWorkEntries((w) => w.map((e, i) => i === idx ? { ...e, [key]: val } : e));
  }

  function updateProject(idx: number, key: keyof ProjectEntry, val: string | string[]) {
    setProjectEntries((p) => p.map((e, i) => i === idx ? { ...e, [key]: val } : e));
  }

  function updateWorkBullet(workIdx: number, bulletIdx: number, val: string) {
    setWorkEntries((w) => w.map((e, i) => {
      if (i !== workIdx) return e;
      const bullets = [...e.bullets];
      bullets[bulletIdx] = val;
      return { ...e, bullets };
    }));
  }

  function addWorkBullet(workIdx: number) {
    setWorkEntries((w) => w.map((e, i) => i === workIdx ? { ...e, bullets: [...e.bullets, ""] } : e));
  }

  function removeWorkBullet(workIdx: number, bulletIdx: number) {
    setWorkEntries((w) => w.map((e, i) => {
      if (i !== workIdx) return e;
      return { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIdx) };
    }));
  }

  function updateProjectBullet(projIdx: number, bulletIdx: number, val: string) {
    setProjectEntries((p) => p.map((e, i) => {
      if (i !== projIdx) return e;
      const bullets = [...e.bullets];
      bullets[bulletIdx] = val;
      return { ...e, bullets };
    }));
  }

  function addProjectBullet(projIdx: number) {
    setProjectEntries((p) => p.map((e, i) => i === projIdx ? { ...e, bullets: [...e.bullets, ""] } : e));
  }

  function removeProjectBullet(projIdx: number, bulletIdx: number) {
    setProjectEntries((p) => p.map((e, i) => {
      if (i !== projIdx) return e;
      return { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIdx) };
    }));
  }

  async function handleCopy(field: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const toSave: Record<string, string | null> = {};
      for (const k of EDITABLE_KEYS) toSave[k] = form[k] ?? null;
      toSave.photo = photo;
      toSave.summary = form.summary ?? null;
      toSave.workExperience = JSON.stringify(workEntries.filter((e) => e.company || e.role));
      toSave.projects = JSON.stringify(projectEntries.filter((e) => e.name));
      const result = await upsertProfile(toSave);
      if (result) {
        const r = result as unknown as Profile;
        setOriginal(r);
        setForm(r);
        setPhoto(r.photo ?? null);
        setWorkEntries(parseJSON<WorkEntry[]>(r.workExperience, []));
        setProjectEntries(parseJSON<ProjectEntry[]>(r.projects, []));
      }
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({ ...original });
    setWorkEntries(parseJSON<WorkEntry[]>(original.workExperience, []));
    setProjectEntries(parseJSON<ProjectEntry[]>(original.projects, []));
    setEditing(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Photo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setForm((f) => ({ ...f, photo: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhoto(null);
    setForm((f) => ({ ...f, photo: null }));
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const resp = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      const parsed: Profile = data.profile;

      const hasExisting = EDITABLE_KEYS.some((k) => original[k]?.trim()) ||
        original.workExperience || original.projects;
      if (hasExisting) {
        setParseResult(parsed);
        setShowOverwriteWarning(true);
      } else {
        applyParsedData(parsed, false);
        setEditing(true);
      }
    } catch (err) {
      alert(`Parse failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setParsing(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  function applyParsedData(parsed: Profile, merge: boolean) {
    const updated = { ...form };
    for (const k of EDITABLE_KEYS) {
      if (parsed[k]) {
        if (merge && original[k]?.trim()) continue;
        updated[k] = parsed[k];
      }
    }
    if (parsed.summary) {
      if (!merge || !original.summary?.trim()) updated.summary = parsed.summary;
    }
    setForm(updated);

    const parsedWork = parseJSON<WorkEntry[]>(parsed.workExperience as string, []);
    const parsedProjects = parseJSON<ProjectEntry[]>(parsed.projects as string, []);

    if (merge) {
      if (workEntries.length === 0 && parsedWork.length > 0) setWorkEntries(parsedWork);
      if (projectEntries.length === 0 && parsedProjects.length > 0) setProjectEntries(parsedProjects);
    } else {
      if (parsedWork.length > 0) setWorkEntries(parsedWork);
      if (parsedProjects.length > 0) setProjectEntries(parsedProjects);
    }
    setEditing(true);
    setShowOverwriteWarning(false);
    setParseResult(null);
  }

  function getDiff(field: string): { old: string; new: string; changed: boolean } {
    const oldVal = original[field] ?? "";
    const newVal = parseResult?.[field] ?? "";
    return { old: oldVal, new: newVal, changed: !!newVal && newVal !== oldVal };
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex flex-1 items-center justify-center text-sm text-graphite">Loading profile...</div>
      </SidebarLayout>
    );
  }

  const isEmpty = !EDITABLE_KEYS.some((k) => original[k]?.trim()) && !original.workExperience && !original.projects;
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = (form.firstName?.[0] ?? "") + (form.lastName?.[0] ?? "");
  const work = parseJSON<WorkEntry[]>(form.workExperience, []);
  const projects = parseJSON<ProjectEntry[]>(form.projects, []);

  return (
    <SidebarLayout>
      <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 bg-[#09090b]">
        <div className="mx-auto w-full max-w-4xl space-y-5">

          {/* ── Overwrite Warning ── */}
          {showOverwriteWarning && parseResult && (
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="text-sm font-medium text-amber-200">Profile Already Has Data</h3>
                  <p className="mt-1 text-xs text-amber-300/70">Choose how to apply the parsed resume data.</p>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-800">
                      <th className="px-3 py-2 text-left font-medium text-zinc-400">Field</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-400">Current</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-400">From Resume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EDITABLE_KEYS.filter((k) => parseResult[k]?.trim()).map((k) => {
                      const d = getDiff(k);
                      if (!d.new) return null;
                      return (
                        <tr key={k} className="border-b border-zinc-800">
                          <td className="px-3 py-2 font-medium text-zinc-300">{FIELD_LABELS[k]}</td>
                          <td className="px-3 py-2 text-zinc-500">{d.old || <span className="italic">empty</span>}</td>
                          <td className={`px-3 py-2 ${d.changed ? "font-medium text-amber-300" : "text-zinc-400"}`}>{d.new}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => applyParsedData(parseResult, false)} className="rounded-md bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200 transition">Overwrite All</button>
                <button onClick={() => applyParsedData(parseResult, true)} className="rounded-md border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition">Merge</button>
                <button onClick={() => { setShowOverwriteWarning(false); setParseResult(null); }} className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition">Cancel</button>
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">Profile</h2>
            <div className="flex items-center gap-3">
              {saved && <span className="text-xs text-zinc-500">Saved</span>}
              {!editing && !isEmpty && (
                <button onClick={() => setEditing(true)} className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* ═══════════════════════ VIEW MODE ═══════════════════════ */}
          {!editing && !isEmpty && (
            <>
              {/* ── Hero ── */}
              <section className="flex flex-col gap-6 lg:flex-row">
                {/* Left: Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{displayName}</h1>
                    {(form.currentTitle || form.currentCompany) && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {form.currentTitle}{form.currentTitle && form.currentCompany ? " at " : ""}{form.currentCompany}
                      </p>
                    )}
                  </div>

                  {form.summary && (
                    <p className="max-w-lg text-sm leading-relaxed text-zinc-400">{form.summary}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {form.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPinIcon />
                        {form.city}{form.country ? `, ${form.country}` : ""}
                      </span>
                    )}
                    {form.yearsExperience && (
                      <span>{form.yearsExperience} years experience</span>
                    )}
                  </div>

                  {/* Social + Contact — single clean row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                    {form.email && (
                      <a href={`mailto:${form.email}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
                        <MailIcon />
                        <span>{form.email}</span>
                      </a>
                    )}
                    {form.githubUrl && (
                      <a href={form.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
                        <GithubIcon />
                        <span>{form.githubUrl.split("/").pop()}</span>
                      </a>
                    )}
                    {form.linkedinUrl && (
                      <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
                        <LinkedInIcon />
                        <span>{form.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>
                      </a>
                    )}
                    {form.portfolioUrl && (
                      <a href={form.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
                        <GlobeIcon />
                        <span>{form.portfolioUrl.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setShowBadgeView(true)}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Show Profile Badge
                    </button>
                  </div>
                </div>
              </section>

              <div className="h-px bg-zinc-800" />

              {/* ── Skills ── */}
              {form.skills && (
                <section>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {form.skills.split(/[,\n]+/).filter(Boolean).map((s, i) => (
                      <span key={i} className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{s.trim()}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Work Experience ── */}
              {work.length > 0 && (
                <section id="experience-section">
                  <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Experience</h3>
                  <div className="space-y-4">
                    {work.map((w, i) => (
                      <div key={i} className="group">
                        <div className="flex items-baseline justify-between gap-4">
                          <h4 className="text-sm font-medium text-white">{w.role || "Role"}</h4>
                          <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                            {w.startDate}{w.startDate && w.endDate ? " — " : ""}{w.endDate || "Present"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">{w.company}{w.location ? ` · ${w.location}` : ""}</p>
                        {w.bullets.filter(Boolean).length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {w.bullets.filter(Boolean).map((b, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {i < work.length - 1 && <div className="mt-4 h-px bg-zinc-800" />}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Projects ── */}
              {projects.length > 0 && (
                <section>
                  <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Projects</h3>
                  <div className="space-y-3">
                    {projects.map((p, i) => (
                      <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <h4 className="text-sm font-medium text-white">{p.name}</h4>
                          {p.bullets.filter(Boolean).length > 0 && (
                            <span className="shrink-0 text-[10px] text-zinc-500">
                              {p.bullets.filter(Boolean).length} bullet{p.bullets.filter(Boolean).length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {p.description && <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{p.description}</p>}
                        {p.tech && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {p.tech.split(",").slice(0, 6).map((t, j) => (
                              <span key={j} className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{t.trim()}</span>
                            ))}
                          </div>
                        )}
                        {p.bullets.filter(Boolean).length > 0 && (
                          <ul className="mt-2.5 space-y-1">
                            {p.bullets.filter(Boolean).map((b, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Education ── */}
              {form.education && (
                <section>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Education</h3>
                  <p className="text-sm text-zinc-300">{form.education}</p>
                </section>
              )}
            </>
          )}

          {/* ── Empty State ── */}
          {!editing && isEmpty && (
            <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                <BriefcaseIcon />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">No Profile Yet</h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs mx-auto">
                  Set up your profile to auto-fill job applications with the Chrome extension.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setEditing(true)} className="rounded-md bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200 transition">Create Profile</button>
                <input ref={resumeInputRef} type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                <button onClick={() => resumeInputRef.current?.click()} disabled={parsing} className="rounded-md border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition">
                  {parsing ? "Parsing..." : "Import from Resume"}
                </button>
              </div>
            </section>
          )}

          {/* ═══════════════════════ EDIT MODE ═══════════════════════ */}
          {editing && (
            <>
              {/* Photo + Resume Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <section className="rounded-xl border border-hairline bg-paper p-4">
                  <h3 className="text-sm font-semibold text-ink mb-3">Photo</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                      <div className="h-16 w-16 rounded-full bg-cloud overflow-hidden flex items-center justify-center border-2 border-dashed border-steel group-hover:border-primary transition-colors">
                        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span className="text-lg font-semibold text-graphite">{initials || "+"}</span>}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-medium text-on-primary">{photo ? "Change" : "Upload"}</span>
                      </div>
                    </div>
                    <div className="text-xs text-graphite">
                      <p>JPG or PNG, up to 2MB</p>
                      <div className="mt-1 flex gap-2">
                        <button onClick={() => photoInputRef.current?.click()} className="text-primary hover:underline font-medium">{photo ? "Change" : "Upload"}</button>
                        {photo && <button onClick={removePhoto} className="text-error hover:underline font-medium">Remove</button>}
                      </div>
                    </div>
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} className="hidden" />
                </section>

                <section className="rounded-xl border border-hairline bg-paper p-4">
                  <h3 className="text-sm font-semibold text-ink mb-3">Resume Import</h3>
                  <p className="text-xs text-graphite mb-3">Upload a PDF to auto-fill all fields below.</p>
                  <input ref={resumeInputRef} type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                  <button onClick={() => resumeInputRef.current?.click()} disabled={parsing} className="rounded-md border border-hairline bg-canvas px-4 py-2 text-xs font-medium text-ink hover:bg-cloud disabled:opacity-50 w-full">
                    {parsing ? "Parsing..." : "Upload Resume PDF"}
                  </button>
                </section>
              </div>

              {/* Personal Info */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(["firstName", "lastName", "email", "phone", "city", "country"] as const).map((k) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS[k]}</label>
                      <input type={k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={form[k] ?? ""} onChange={(e) => setField(k, e.target.value)}
                        className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Professional */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Professional</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(["currentTitle", "currentCompany", "yearsExperience", "workAuthorization"] as const).map((k) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS[k]}</label>
                      <input type="text" value={form[k] ?? ""} onChange={(e) => setField(k, e.target.value)}
                        className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-graphite">Salary Expectation</label>
                    <input type="text" value={form.salaryExpectation ?? ""} onChange={(e) => setField("salaryExpectation", e.target.value)}
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Summary */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">About</h3>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">Professional Summary</label>
                  <textarea value={form.summary ?? ""} onChange={(e) => setField("summary", e.target.value)} rows={4}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder="A concise 2-3 sentence professional summary..." />
                  <p className="mt-1 text-[11px] text-graphite">Max 100 words. Used by the Chrome extension for auto-fill.</p>
                </div>
              </section>

              {/* Work Experience */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Work Experience</h3>
                  <button onClick={() => setWorkEntries((w) => [...w, emptyWork()])} className="text-xs text-primary hover:underline font-medium">+ Add Entry</button>
                </div>
                {workEntries.length === 0 && <p className="text-xs text-graphite italic">No entries yet. Add your work experience above.</p>}
                {workEntries.map((w, i) => (
                  <div key={i} className="rounded-lg border border-hairline bg-canvas p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-graphite">Entry {i + 1}</span>
                      <button onClick={() => setWorkEntries((e) => e.filter((_, j) => j !== i))} className="text-xs text-error hover:underline">Remove</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Company</label>
                        <input type="text" value={w.company} onChange={(e) => updateWork(i, "company", e.target.value)}
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Role</label>
                        <input type="text" value={w.role} onChange={(e) => updateWork(i, "role", e.target.value)}
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Start Date</label>
                        <input type="text" value={w.startDate} onChange={(e) => updateWork(i, "startDate", e.target.value)} placeholder="e.g. Jul 2024"
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-graphite">End Date</label>
                        <input type="text" value={w.endDate} onChange={(e) => updateWork(i, "endDate", e.target.value)} placeholder="e.g. Present"
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Location</label>
                        <input type="text" value={w.location} onChange={(e) => updateWork(i, "location", e.target.value)} placeholder="e.g. Mumbai, India"
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-graphite">Bullets</label>
                        <button onClick={() => addWorkBullet(i)} className="text-[11px] text-primary hover:underline">+ Add</button>
                      </div>
                      {w.bullets.map((b, j) => (
                        <div key={j} className="flex gap-2 mb-1.5">
                          <input type="text" value={b} onChange={(e) => updateWorkBullet(i, j, e.target.value)} placeholder="Achievement or responsibility..."
                            className="flex-1 rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                          {w.bullets.length > 1 && (
                            <button onClick={() => removeWorkBullet(i, j)} className="text-graphite hover:text-error text-xs">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              {/* Projects */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Projects</h3>
                  <button onClick={() => setProjectEntries((p) => [...p, emptyProject()])} className="text-xs text-primary hover:underline font-medium">+ Add Entry</button>
                </div>
                {projectEntries.length === 0 && <p className="text-xs text-graphite italic">No entries yet. Add your projects above.</p>}
                {projectEntries.map((p, i) => (
                  <div key={i} className="rounded-lg border border-hairline bg-canvas p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-graphite">Entry {i + 1}</span>
                      <button onClick={() => setProjectEntries((e) => e.filter((_, j) => j !== i))} className="text-xs text-error hover:underline">Remove</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Name</label>
                        <input type="text" value={p.name} onChange={(e) => updateProject(i, "name", e.target.value)}
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Tech Stack</label>
                        <input type="text" value={p.tech} onChange={(e) => updateProject(i, "tech", e.target.value)} placeholder="React, Node.js, etc."
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-graphite">Description</label>
                        <input type="text" value={p.description} onChange={(e) => updateProject(i, "description", e.target.value)} placeholder="One-line description"
                          className="w-full rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-graphite">Bullets</label>
                        <button onClick={() => addProjectBullet(i)} className="text-[11px] text-primary hover:underline">+ Add</button>
                      </div>
                      {p.bullets.map((b, j) => (
                        <div key={j} className="flex gap-2 mb-1.5">
                          <input type="text" value={b} onChange={(e) => updateProjectBullet(i, j, e.target.value)} placeholder="What was built or achieved..."
                            className="flex-1 rounded-md border border-steel bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none" />
                          {p.bullets.length > 1 && (
                            <button onClick={() => removeProjectBullet(i, j)} className="text-graphite hover:text-error text-xs">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              {/* Skills */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Skills</h3>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">Skills</label>
                  <textarea value={form.skills ?? ""} onChange={(e) => setField("skills", e.target.value)} rows={3}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder="Comma-separated skills" />
                </div>
              </section>

              {/* Links */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Links</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-graphite">LinkedIn URL</label>
                    <input type="url" value={form.linkedinUrl ?? ""} onChange={(e) => setField("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-graphite">GitHub URL</label>
                    <input type="url" value={form.githubUrl ?? ""} onChange={(e) => setField("githubUrl", e.target.value)} placeholder="https://github.com/..."
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-graphite">Portfolio URL</label>
                    <input type="url" value={form.portfolioUrl ?? ""} onChange={(e) => setField("portfolioUrl", e.target.value)} placeholder="https://..."
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none" />
                  </div>
                </div>
              </section>

              {/* Save / Cancel */}
              <div className="flex items-center gap-3 pb-8">
                <button onClick={handleSave} disabled={saving}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel">
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                <button onClick={handleCancel} className="rounded-md border border-hairline bg-canvas px-5 py-2.5 text-sm font-medium text-ink hover:bg-cloud">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <BadgeModal
        open={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        data={badgeData}
        onSave={(d) => {
          setBadgeData(d);
          setBadgeRefreshKey((k) => k + 1);
        }}
      />

      {/* Badge View Modal */}
      {showBadgeView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowBadgeView(false)}>
          <div className="relative bg-[#09090b] border border-zinc-800 rounded-xl p-5 w-[320px] mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Profile Badge</h3>
              <button onClick={() => setShowBadgeView(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center overflow-hidden rounded-lg">
              <div data-badge-modal style={{ width: "260px", height: "414px" }}>
                <Badge refreshKey={badgeRefreshKey} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const svgEl = document.querySelector("[data-badge-modal] svg");
                  if (!svgEl) return;
                  const svgData = new XMLSerializer().serializeToString(svgEl);
                  const canvas = document.createElement("canvas");
                  canvas.width = 384;
                  canvas.height = 612;
                  const ctx = canvas.getContext("2d");
                  const img = new Image();
                  img.onload = () => {
                    ctx?.drawImage(img, 0, 0);
                    const link = document.createElement("a");
                    const name = (form.firstName || "user").toLowerCase().replace(/\s+/g, "-");
                    link.download = `${name}-badge.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                  };
                  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="flex-1 rounded-md bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200 transition"
              >
                Download PNG
              </button>
              <button
                onClick={() => {
                  setShowBadgeView(false);
                  setShowBadgeModal(true);
                }}
                className="flex-1 rounded-md border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
              >
                Edit Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}