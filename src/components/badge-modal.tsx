"use client";

import { useState, useRef } from "react";
import { upsertBadgeData, type BadgeData } from "@/lib/actions/badge";

interface BadgeModalProps {
  open: boolean;
  onClose: () => void;
  data: BadgeData | null;
  onSave: (data: BadgeData) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
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
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
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
          <button onClick={onClose} className="rounded-lg p-1.5 text-graphite hover:bg-cloud hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo */}
          <div>
            <label className={labelClass}>Photo</label>
            <div className="mt-1 flex items-center gap-3">
              {form.photo && (
                <img src={form.photo} alt="Preview" className="h-14 w-14 rounded-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-hairline px-3 py-2 text-xs font-medium text-graphite hover:border-primary hover:text-primary"
              >
                {form.photo ? "Change Photo" : "Upload Photo"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
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
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-graphite">Stats</p>
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
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-graphite hover:bg-cloud">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Badge"}
          </button>
        </div>
      </div>
    </div>
  );
}
