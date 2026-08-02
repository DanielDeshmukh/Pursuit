"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getProfile, upsertProfile } from "@/lib/actions/profile";

type Profile = Record<string, string | null>;

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name", lastName: "Last Name", email: "Email",
  phone: "Phone", address: "Address", city: "City", state: "State",
  zipCode: "Zip Code", country: "Country", linkedinUrl: "LinkedIn",
  portfolioUrl: "Portfolio", currentTitle: "Current Title",
  currentCompany: "Current Company", yearsExperience: "Experience",
  education: "Education", skills: "Skills",
  workAuthorization: "Work Authorization",
  salaryExpectation: "Salary Expectation", bio: "Bio",
  coverLetterTemplate: "Cover Letter", customAnswers: "Custom Answers",
};

const EDITABLE_KEYS = [
  "firstName", "lastName", "email", "phone", "address", "city", "state",
  "zipCode", "country", "linkedinUrl", "portfolioUrl", "currentTitle",
  "currentCompany", "yearsExperience", "education", "skills",
  "workAuthorization", "salaryExpectation", "bio", "coverLetterTemplate",
  "customAnswers",
];

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

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setForm(p);
        setOriginal(p);
        setPhoto(p.photo ?? null);
      }
      setLoading(false);
    });
  }, []);

  function setField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const toSave: Record<string, string | null> = {};
      for (const k of EDITABLE_KEYS) toSave[k] = form[k] ?? null;
      toSave.photo = photo;
      const result = await upsertProfile(toSave);
      if (result) {
        setOriginal(result);
        setForm(result);
        setPhoto(result.photo ?? null);
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
    setEditing(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
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

      const hasExisting = EDITABLE_KEYS.some((k) => original[k]?.trim());
      if (hasExisting) {
        setParseResult(parsed);
        setShowOverwriteWarning(true);
      } else {
        const updated = { ...form };
        for (const k of EDITABLE_KEYS) {
          if (parsed[k]) updated[k] = parsed[k];
        }
        setForm(updated);
        setEditing(true);
      }
    } catch (err) {
      alert(`Parse failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setParsing(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  function applyParsed(merge: boolean) {
    if (!parseResult) return;
    if (merge) {
      const updated = { ...form };
      for (const k of EDITABLE_KEYS) {
        if (parseResult[k] && !original[k]?.trim()) updated[k] = parseResult[k];
      }
      setForm(updated);
    } else {
      const updated = { ...form };
      for (const k of EDITABLE_KEYS) {
        if (parseResult[k]) updated[k] = parseResult[k];
      }
      setForm(updated);
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
        <div className="flex flex-1 items-center justify-center text-sm text-graphite">
          Loading profile...
        </div>
      </SidebarLayout>
    );
  }

  const isEmpty = !EDITABLE_KEYS.some((k) => original[k]?.trim());
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = (form.firstName?.[0] ?? "") + (form.lastName?.[0] ?? "");

  return (
    <SidebarLayout>
      <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl space-y-6">

          {/* ── Overwrite Warning Modal ── */}
          {showOverwriteWarning && parseResult && (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber/20 text-sm">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Resume Already Has Data</h3>
                  <p className="mt-1 text-xs text-charcoal">
                    Your profile already contains data. Choose how to apply the parsed resume.
                  </p>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-hairline">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-snow">
                      <th className="px-3 py-2 text-left font-medium text-graphite">Field</th>
                      <th className="px-3 py-2 text-left font-medium text-graphite">Current</th>
                      <th className="px-3 py-2 text-left font-medium text-graphite">From Resume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EDITABLE_KEYS.filter((k) => parseResult[k]?.trim()).map((k) => {
                      const d = getDiff(k);
                      if (!d.new) return null;
                      return (
                        <tr key={k} className={`border-b border-hairline ${d.changed ? "bg-amber/5" : ""}`}>
                          <td className="px-3 py-2 font-medium text-ink">{FIELD_LABELS[k]}</td>
                          <td className="px-3 py-2 text-charcoal">{d.old || <span className="text-graphite italic">empty</span>}</td>
                          <td className={`px-3 py-2 ${d.changed ? "font-medium text-amber-deep" : "text-charcoal"}`}>
                            {d.new}
                            {d.changed && <span className="ml-1 text-[10px] text-amber-deep">changed</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => applyParsed(false)}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-deep"
                >
                  Overwrite All
                </button>
                <button
                  onClick={() => applyParsed(true)}
                  className="rounded-md border border-hairline bg-canvas px-4 py-2 text-xs font-medium text-ink hover:bg-cloud"
                >
                  Merge (Keep Existing)
                </button>
                <button
                  onClick={() => { setShowOverwriteWarning(false); setParseResult(null); }}
                  className="rounded-md px-4 py-2 text-xs font-medium text-graphite hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">Profile</h2>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-sm font-medium text-graphite animate-pulse">Saved!</span>
              )}
              {!editing && !isEmpty && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-hairline bg-canvas px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-cloud"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* ── Profile Card (view mode) ── */}
          {!editing && !isEmpty && (
            <section className="rounded-xl border border-hairline bg-paper overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

              <div className="px-6 pb-6">
                {/* Photo + Name Row */}
                <div className="flex items-end gap-5 -mt-10">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full border-4 border-paper bg-cloud overflow-hidden flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-semibold text-graphite">{initials || "?"}</span>
                      )}
                    </div>
                  </div>
                  <div className="pb-1">
                    <h3 className="text-xl font-semibold text-ink">{displayName}</h3>
                    {form.currentTitle && form.currentCompany && (
                      <p className="text-sm text-charcoal">{form.currentTitle} at {form.currentCompany}</p>
                    )}
                    {form.currentTitle && !form.currentCompany && (
                      <p className="text-sm text-charcoal">{form.currentTitle}</p>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Contact */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">Contact</h4>
                    <div className="space-y-1.5 text-sm">
                      {form.email && (
                        <div className="flex items-center gap-2 text-charcoal">
                          <span className="text-graphite">{form.email}</span>
                        </div>
                      )}
                      {form.phone && (
                        <div className="flex items-center gap-2 text-charcoal">
                          <span className="text-graphite">{form.phone}</span>
                        </div>
                      )}
                      {(form.city || form.state || form.country) && (
                        <div className="flex items-center gap-2 text-charcoal">
                          <span className="text-graphite">
                            {[form.city, form.state, form.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">Links</h4>
                    <div className="space-y-1.5 text-sm">
                      {form.linkedinUrl && (
                        <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="block truncate text-primary hover:underline">{form.linkedinUrl}</a>
                      )}
                      {form.portfolioUrl && (
                        <a href={form.portfolioUrl} target="_blank" rel="noopener noreferrer"
                          className="block truncate text-primary hover:underline">{form.portfolioUrl}</a>
                      )}
                      {!form.linkedinUrl && !form.portfolioUrl && (
                        <p className="text-xs text-graphite italic">No links added</p>
                      )}
                    </div>
                  </div>

                  {/* Professional */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">Professional</h4>
                    <div className="space-y-1.5 text-sm text-charcoal">
                      {form.yearsExperience && <div>{form.yearsExperience} years experience</div>}
                      {form.education && <div>{form.education}</div>}
                      {form.workAuthorization && <div>{form.workAuthorization}</div>}
                      {form.salaryExpectation && <div>{form.salaryExpectation}</div>}
                      {!form.yearsExperience && !form.education && !form.workAuthorization && !form.salaryExpectation && (
                        <p className="text-xs text-graphite italic">No professional details added</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">About</h4>
                    {form.bio ? (
                      <p className="text-sm leading-relaxed text-charcoal whitespace-pre-line">{form.bio}</p>
                    ) : (
                      <p className="text-xs text-graphite italic">No bio added</p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {form.skills && (
                  <div className="mt-5">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {form.skills.split(/[,\n]+/).filter(Boolean).map((s, i) => (
                        <span key={i} className="rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary-deep">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Empty State ── */}
          {!editing && isEmpty && (
            <section className="rounded-xl border border-dashed border-steel bg-paper p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cloud text-2xl">
                👤
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">No Profile Yet</h3>
                <p className="mt-1 text-xs text-graphite max-w-xs mx-auto">
                  Set up your profile to auto-fill job applications with the Chrome extension.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-primary px-5 py-2 text-xs font-semibold text-on-primary hover:bg-primary-deep"
                >
                  Create Profile
                </button>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <button
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={parsing}
                  className="rounded-md border border-hairline bg-canvas px-5 py-2 text-xs font-medium text-ink hover:bg-cloud disabled:opacity-50"
                >
                  {parsing ? "Parsing..." : "Import from Resume"}
                </button>
              </div>
            </section>
          )}

          {/* ── Edit Form ── */}
          {editing && (
            <>
              {/* Photo Upload */}
              <section className="rounded-xl border border-hairline bg-paper p-5">
                <div className="flex items-center gap-5">
                  <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                    <div className="h-20 w-20 rounded-full bg-cloud overflow-hidden flex items-center justify-center border-2 border-dashed border-steel group-hover:border-primary transition-colors">
                      {photo ? (
                        <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-semibold text-graphite">{initials || "+"}</span>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-medium text-on-primary">{photo ? "Change" : "Upload"}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">Profile Photo</p>
                    <p className="mt-0.5 text-xs text-graphite">JPG or PNG, up to 2MB</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {photo ? "Change Photo" : "Upload Photo"}
                      </button>
                      {photo && (
                        <button onClick={removePhoto} className="text-xs text-error hover:underline font-medium">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </section>

              {/* Resume Import */}
              <section className="rounded-xl border border-hairline bg-paper p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-ink">Resume Import</h3>
                    <p className="mt-1 text-xs text-graphite">Upload a PDF to auto-fill fields below.</p>
                  </div>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={parsing}
                    className="rounded-md border border-hairline bg-canvas px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-cloud disabled:opacity-50"
                  >
                    {parsing ? "Parsing..." : "Upload Resume"}
                  </button>
                </div>
              </section>

              {/* Personal Info */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(["firstName", "lastName", "email", "phone"] as const).map((k) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS[k]}</label>
                      <input
                        type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                        value={form[k] ?? ""}
                        onChange={(e) => setField(k, e.target.value)}
                        className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Location */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Location</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-graphite">Address</label>
                    <input
                      type="text"
                      value={form.address ?? ""}
                      onChange={(e) => setField("address", e.target.value)}
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                  {(["city", "state", "zipCode", "country"] as const).map((k) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS[k]}</label>
                      <input
                        type="text"
                        value={form[k] ?? ""}
                        onChange={(e) => setField(k, e.target.value)}
                        className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                      />
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
                      <input
                        type="text"
                        value={form[k] ?? ""}
                        onChange={(e) => setField(k, e.target.value)}
                        className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS.salaryExpectation}</label>
                    <input
                      type="text"
                      value={form.salaryExpectation ?? ""}
                      onChange={(e) => setField("salaryExpectation", e.target.value)}
                      className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Links */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Links</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(["linkedinUrl", "portfolioUrl"] as const).map((k) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS[k]}</label>
                      <input
                        type="url"
                        value={form[k] ?? ""}
                        onChange={(e) => setField(k, e.target.value)}
                        className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        placeholder={k === "linkedinUrl" ? "https://linkedin.com/in/..." : "https://..."}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* About & Skills */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">About</h3>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS.bio}</label>
                  <textarea
                    value={form.bio ?? ""}
                    onChange={(e) => setField("bio", e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">{FIELD_LABELS.skills}</label>
                  <textarea
                    value={form.skills ?? ""}
                    onChange={(e) => setField("skills", e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder="Comma-separated skills"
                  />
                </div>
              </section>

              {/* Templates */}
              <section className="rounded-xl border border-hairline bg-paper p-5 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Templates</h3>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">Cover Letter Template</label>
                  <textarea
                    value={form.coverLetterTemplate ?? ""}
                    onChange={(e) => setField("coverLetterTemplate", e.target.value)}
                    rows={8}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder="Write your cover letter template here..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-graphite">Custom Q&amp;A Answers</label>
                  <textarea
                    value={form.customAnswers ?? ""}
                    onChange={(e) => setField("customAnswers", e.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-steel bg-canvas px-3 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                    placeholder='{"Why this company?": "Because...", "Where do you see yourself?": "..."}'
                  />
                  <p className="mt-1 text-xs text-graphite">JSON object mapping question prompts to your answers.</p>
                </div>
              </section>

              {/* Save / Cancel */}
              <div className="flex items-center gap-3 pb-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-md border border-hairline bg-canvas px-5 py-2.5 text-sm font-medium text-ink hover:bg-cloud"
                >
                  Cancel
                </button>
                {saved && (
                  <span className="text-sm font-medium text-graphite">Saved!</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
