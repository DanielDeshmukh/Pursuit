"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getProfile, upsertProfile } from "@/lib/actions/profile";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [bio, setBio] = useState("");
  const [coverLetterTemplate, setCoverLetterTemplate] = useState("");
  const [customAnswers, setCustomAnswers] = useState("");

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setEmail(p.email ?? "");
        setPhone(p.phone ?? "");
        setAddress(p.address ?? "");
        setCity(p.city ?? "");
        setState(p.state ?? "");
        setZipCode(p.zipCode ?? "");
        setCountry(p.country ?? "");
        setLinkedinUrl(p.linkedinUrl ?? "");
        setPortfolioUrl(p.portfolioUrl ?? "");
        setCurrentTitle(p.currentTitle ?? "");
        setCurrentCompany(p.currentCompany ?? "");
        setYearsExperience(p.yearsExperience ?? "");
        setEducation(p.education ?? "");
        setSkills(p.skills ?? "");
        setWorkAuthorization(p.workAuthorization ?? "");
        setSalaryExpectation(p.salaryExpectation ?? "");
        setBio(p.bio ?? "");
        setCoverLetterTemplate(p.coverLetterTemplate ?? "");
        setCustomAnswers(p.customAnswers ?? "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await upsertProfile({
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        linkedinUrl,
        portfolioUrl,
        currentTitle,
        currentCompany,
        yearsExperience,
        education,
        skills,
        workAuthorization,
        salaryExpectation,
        bio,
        coverLetterTemplate,
        customAnswers,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseStatus("Parsing resume...");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const resp = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      const p = data.profile;
      if (p.firstName) setFirstName(p.firstName);
      if (p.lastName) setLastName(p.lastName);
      if (p.email) setEmail(p.email);
      if (p.phone) setPhone(p.phone);
      if (p.linkedinUrl) setLinkedinUrl(p.linkedinUrl);
      if (p.portfolioUrl) setPortfolioUrl(p.portfolioUrl);
      if (p.city) setCity(p.city);
      if (p.education) setEducation(p.education);
      if (p.skills) setSkills(p.skills);
      if (p.bio) setBio(p.bio);
      setParseStatus("Resume parsed! Review and save your profile.");
      setTimeout(() => setParseStatus(""), 5000);
    } catch (err) {
      setParseStatus(`Error: ${err instanceof Error ? err.message : "Failed to parse"}`);
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

  return (
    <SidebarLayout>
      <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-ink">Profile</h2>
          <p className="mt-1 text-sm text-graphite">
            Your information for auto-filling job applications via the Chrome extension.
          </p>
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-8">
          <section className="rounded-xl border border-hairline bg-paper p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-ink">Resume Import</h3>
                <p className="mt-1 text-xs text-graphite">Upload a PDF resume to auto-fill your profile fields.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer rounded-md border border-hairline bg-canvas px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-cloud"
              >
                {parsing ? "Parsing..." : "Upload Resume"}
              </label>
            </div>
            {parseStatus && (
              <p className={`mt-3 text-xs ${parseStatus.startsWith("Error") ? "text-error" : "text-primary"}`}>
                {parseStatus}
              </p>
            )}
          </section>
          <section>
            <h3 className="mb-3 text-sm font-medium text-ink">Personal Info</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-ink">Location</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-graphite">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Zip Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-ink">Professional</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Current Title</label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Current Company</label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Years of Experience</label>
                <input
                  type="text"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Work Authorization</label>
                <input
                  type="text"
                  value={workAuthorization}
                  onChange={(e) => setWorkAuthorization(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-graphite">Salary Expectation</label>
                <input
                  type="text"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-ink">Links</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Portfolio URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-ink">About</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Skills</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  placeholder="One skill per line, or comma-separated"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium text-ink">Templates</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Cover Letter Template</label>
                <textarea
                  value={coverLetterTemplate}
                  onChange={(e) => setCoverLetterTemplate(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  placeholder="Write your cover letter template here..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite">Custom Q&amp;A Answers</label>
                <textarea
                  value={customAnswers}
                  onChange={(e) => setCustomAnswers(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-steel bg-canvas px-3 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                  placeholder='{"Why this company?": "Because...", "Where do you see yourself?": "..."}'
                />
                <p className="mt-1 text-xs text-graphite">
                  JSON object mapping question prompts to your answers.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-on-primary hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {saved && (
              <span className="text-sm font-medium text-graphite">Saved!</span>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
