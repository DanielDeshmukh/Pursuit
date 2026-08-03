"use client";

import { useState, useRef } from "react";
import { upsertBadgeData, type BadgeData } from "@/lib/actions/badge";
import { alignPhoto } from "@/lib/image-align";

interface BadgeModalProps {
  open: boolean;
  onClose: () => void;
  data: BadgeData | null;
  onSave: (data: BadgeData) => void;
}

type AnalysisResult = {
  hasBackground: boolean;
  backgroundType: string;
  personVisible: boolean;
  shoulderOffset: number;
  headPosition: number;
  recommendedCrop: { x: number; y: number; width: number; height: number };
  quality: string;
};

type ProcessingStep = "idle" | "analyzing" | "prompt-bg" | "removing-bg" | "aligning" | "ready";

const STEP_ORDER: ProcessingStep[] = ["analyzing", "prompt-bg", "aligning", "ready"];

function StepIndicator({ current }: { current: ProcessingStep }) {
  const idx = STEP_ORDER.indexOf(current);
  if (idx < 0) return null;
  const steps = [
    { key: "analyzing", label: "Analyze" },
    { key: "prompt-bg", label: "Background" },
    { key: "aligning", label: "Align" },
    { key: "ready", label: "Ready" },
  ];
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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [rawPhoto, setRawPhoto] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setProcessing("analyzing");
      setAnalysisError(null);
      setAnalysis(null);
      setRawPhoto(base64);

      try {
        const res = await fetch("/api/image/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Analysis failed");
        }

        const result: AnalysisResult = await res.json();
        setAnalysis(result);

        if (result.hasBackground) {
          setProcessing("prompt-bg");
        } else {
          await applyAlignment(base64, result);
          setProcessing("ready");
        }
      } catch (err: any) {
        console.error("Analysis error:", err);
        setAnalysisError(err.message || "Analysis failed");
        setForm((f) => ({ ...f, photo: base64 }));
        setProcessing("ready");
      }
    };
    reader.readAsDataURL(file);
  };

  const applyAlignment = async (photo: string, result: AnalysisResult) => {
    setProcessing("aligning");
    try {
      const aligned = await alignPhoto(photo, result);
      setForm((f) => ({ ...f, photo: aligned }));
    } catch {
      setForm((f) => ({ ...f, photo }));
    }
  };

  const handleRemoveBackground = async (originalPhoto: string) => {
    setProcessing("removing-bg");

    try {
      const res = await fetch("/api/image/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: originalPhoto }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "BG removal failed");
      }

      const { image: cleanPhoto } = await res.json();
      if (analysis) {
        await applyAlignment(cleanPhoto, analysis);
      } else {
        setForm((f) => ({ ...f, photo: cleanPhoto }));
      }
      setProcessing("ready");
      } catch (err: any) {
        console.error("BG removal error:", err);
        setAnalysisError(err.message || "BG removal failed");
        setForm((f) => ({ ...f, photo: rawPhoto || f.photo }));
        setProcessing("ready");
      }
  };

  const handleSkipBgRemoval = async () => {
    if (analysis && rawPhoto) {
      await applyAlignment(rawPhoto, analysis);
    }
    setProcessing("ready");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await upsertBadgeData({
        ...form,
        overall: Number(form.overall),
        proj: Number(form.proj),
        tech: Number(form.tech),
        cont: Number(form.cont),
        yexp: Number(form.yexp),
        cert: Number(form.cert),
        lang: Number(form.lang),
      });
      if (result) onSave(result);
      resetState();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const resetState = () => {
    setProcessing("idle");
    setAnalysis(null);
    setAnalysisError(null);
    setRawPhoto("");
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
              {(form.photo || rawPhoto) && (
                <img src={form.photo || rawPhoto} alt="Preview" className="h-14 w-14 rounded-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing !== "idle" && processing !== "ready"}
                className="rounded-lg border border-dashed border-hairline px-3 py-2 text-xs font-medium text-graphite hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {processing === "analyzing" && "Analyzing..."}
                {processing === "prompt-bg" || processing === "removing-bg" ? "Processing..." : form.photo ? "Change Photo" : "Upload Photo"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>

            {(processing === "analyzing" || processing === "prompt-bg" || processing === "removing-bg" || processing === "aligning") && (
              <StepIndicator current={processing} />
            )}

            {/* Analysis results */}
            {processing === "analyzing" && (
              <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>
                  Analyzing photo with AI...
                </div>
              </div>
            )}

            {analysisError && (
              <div className="mt-2 rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-xs text-red-500">{analysisError}</p>
                <p className="text-xs text-graphite mt-1">Using photo as-is</p>
              </div>
            )}

            {/* BG removal prompt */}
            {processing === "prompt-bg" && analysis && (
              <div className="mt-3 rounded-lg bg-cloud border border-hairline p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-primary shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <div>
                    <p className="text-sm font-medium text-ink">Background detected</p>
                    <p className="text-xs text-graphite mt-1">
                      Your photo has a <strong>{analysis.backgroundType}</strong> background. 
                      Remove it for a cleaner badge look?
                    </p>
                    <div className="mt-1 text-xs text-graphite">
                      Quality: <span className={`font-medium ${analysis.quality === "good" ? "text-green-500" : analysis.quality === "fair" ? "text-yellow-500" : "text-red-500"}`}>{analysis.quality}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemoveBackground(rawPhoto)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
                  >
                    Remove Background
                  </button>
                  <button
                    onClick={handleSkipBgRemoval}
                    className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-graphite hover:bg-paper"
                  >
                    Keep Background
                  </button>
                </div>
              </div>
            )}

            {processing === "removing-bg" && (
              <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>
                  Removing background...
                </div>
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
              <label className={labelClass}>Flag Emoji</label>
              <input className={inputClass} value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="🇮🇳" />
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
            disabled={saving || (processing !== "idle" && processing !== "ready")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Badge"}
          </button>
        </div>
      </div>
    </div>
  );
}
