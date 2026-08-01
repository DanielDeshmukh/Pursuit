"use client";

import { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  id?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  error,
  label,
  id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-xs font-medium text-graphite"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-md border bg-canvas px-3 py-2 pr-10 text-sm text-ink placeholder:text-graphite focus:outline-none ${
            error
              ? "border-error focus:border-error"
              : "border-steel focus:border-ink"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite hover:text-ink"
          tabIndex={-1}
        >
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
