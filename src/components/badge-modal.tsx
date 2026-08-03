"use client";

import { useState, useRef, useEffect } from "react";
import { upsertBadgeData, type BadgeData } from "@/lib/actions/badge";

interface BadgeModalProps {
  open: boolean;
  onClose: () => void;
  data: BadgeData | null;
  onSave: (data: BadgeData) => void;
}

type ProcessingStep = "idle" | "processing" | "ready";

function StepIndicator({ current }: { current: ProcessingStep }) {
  const steps = [
    { key: "processing", label: "Processing" },
    { key: "ready", label: "Ready" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  if (idx < 0) return null;
  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={`h-1.5 w-6 rounded-full ${i <= idx ? "bg-primary" : "bg-hairline"}`} />
          {i < steps.length - 1 && <div className="h-px w-1 bg-hairline" />}
        </div>
      ))}
    </div>
  );
}

export default function BadgeModal({ open, onClose, data, onSave }: BadgeModalProps) {
  const [form, setForm] = useState({
    firstName: data?.firstName || "",
    overall: data?.overall || 0,
    position: data?.position || "",
    flag: data?.flag || "",
    photo: data?.photo || "",
    proj: data?.proj || 0,
    tech: data?.tech || 0,
    cont: data?.cont || 0,
    yexp: data?.yexp || 0,
    cert: data?.cert || 0,
    lang: data?.lang || 0,
  });
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<ProcessingStep>("idle");
  const [processError, setProcessError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.firstName || "",
        overall: data.overall || 0,
        position: data.position || "",
        flag: data.flag || "",
        photo: data.photo || "",
        proj: data.proj || 0,
        tech: data.tech || 0,
        cont: data.cont || 0,
        yexp: data.yexp || 0,
        cert: data.cert || 0,
        lang: data.lang || 0,
      });
    }
  }, [data]);

  if (!open) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setProcessing("processing");
      setProcessError(null);

      try {
        const res = await fetch("/api/image/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Processing failed");
        }

        const { image: processedPhoto } = await res.json();
        setForm((f) => ({ ...f, photo: processedPhoto }));
        setProcessing("ready");
      } catch (err: any) {
        console.error("Photo processing error:", err);
        setProcessError(err.message || "Processing failed — using original photo");
        setForm((f) => ({ ...f, photo: base64 }));
        setProcessing("ready");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orig = data || {};
      const payload: Partial<BadgeData> = {};
      if (form.photo !== (orig.photo || "")) payload.photo = form.photo || null;
      if (form.firstName !== (orig.firstName || "")) payload.firstName = form.firstName || null;
      if (Number(form.overall) !== (orig.overall ?? 0)) payload.overall = Number(form.overall) ?? null;
      if (form.position !== (orig.position || "")) payload.position = form.position || null;
      if (form.flag !== (orig.flag || "")) payload.flag = form.flag || null;
      if (Number(form.proj) !== (orig.proj ?? 0)) payload.proj = Number(form.proj) ?? null;
      if (Number(form.tech) !== (orig.tech ?? 0)) payload.tech = Number(form.tech) ?? null;
      if (Number(form.cont) !== (orig.cont ?? 0)) payload.cont = Number(form.cont) ?? null;
      if (Number(form.yexp) !== (orig.yexp ?? 0)) payload.yexp = Number(form.yexp) ?? null;
      if (Number(form.cert) !== (orig.cert ?? 0)) payload.cert = Number(form.cert) ?? null;
      if (Number(form.lang) !== (orig.lang ?? 0)) payload.lang = Number(form.lang) ?? null;

      const result = await upsertBadgeData(payload);
      onSave(result || { ...payload, id: "", userId: "default" } as BadgeData);
      resetState();
      onClose();
    } catch (e) {
      console.error("[badge-modal] save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const resetState = () => {
    setProcessing("idle");
    setProcessError(null);
  };

  const inputClass = "w-full rounded-lg border border-hairline bg-cloud px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs font-medium uppercase tracking-wider text-graphite";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-hairline bg-paper p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Edit Badge</h2>
          <button onClick={() => { resetState(); onClose(); }} className="rounded-lg p-1.5 text-graphite hover:bg-cloud hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo with preprocessing */}
          <div>
            <label className={labelClass}>Photo</label>
            <div className="mt-1 flex items-center gap-3">
              {form.photo && (
                <img src={form.photo} alt="Preview" className="h-14 w-14 rounded-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing === "processing"}
                className="rounded-lg border border-dashed border-hairline px-3 py-2 text-xs font-medium text-graphite hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {processing === "processing" ? "Processing..." : form.photo ? "Change Photo" : "Upload Photo"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>

            {(processing === "processing") && (
              <StepIndicator current={processing} />
            )}

            {processing === "processing" && (
              <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>
                  Removing background &amp; aligning photo...
                </div>
              </div>
            )}

            {processError && (
              <div className="mt-2 rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-xs text-red-500">{processError}</p>
              </div>
            )}
          </div>

          {/* Name & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name</label>
              <input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="DANIEL" />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <input className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="ST, MID, DEF..." />
            </div>
          </div>

          {/* Overall & Flag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Overall (1-99)</label>
              <input className={inputClass} type="number" min="1" max="99" value={form.overall} onChange={(e) => setForm({ ...form, overall: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Country Code</label>
              <input className={inputClass} value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="IN, US, BE..." maxLength={2} style={{ textTransform: "uppercase" }} />
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-hairline pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-graphite">Stats (0-99)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Projects</label>
                <input className={inputClass} type="number" min="0" max="99" value={form.proj} onChange={(e) => setForm({ ...form, proj: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Technologies</label>
                <input className={inputClass} type="number" min="0" max="99" value={form.tech} onChange={(e) => setForm({ ...form, tech: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Contributions</label>
                <input className={inputClass} type="number" min="0" max="99" value={form.cont} onChange={(e) => setForm({ ...form, cont: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Years Exp</label>
                <input className={inputClass} type="number" min="0" max="99" value={form.yexp} onChange={(e) => setForm({ ...form, yexp: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Certifications</label>
                <input className={inputClass} type="number" min="0" max="99" value={form.cert} onChange={(e) => setForm({ ...form, cert: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Languages</label>
                <input className={inputClass} type="number" min="0" max="99" value={form.lang} onChange={(e) => setForm({ ...form, lang: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { resetState(); onClose(); }} className="rounded-lg px-4 py-2 text-sm font-medium text-graphite hover:bg-cloud">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || processing === "processing"}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Badge"}
          </button>
        </div>
      </div>
    </div>
  );
}
