"use client";

import { useEffect, useCallback, createContext, useContext, useState } from "react";

type ShortcutMap = Record<string, { description: string; handler: () => void }>;

const ShortcutsContext = createContext<ShortcutMap>({});

export function useShortcutsContext() {
  return useContext(ShortcutsContext);
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      for (const [key, { handler }] of Object.entries(shortcuts)) {
        const parts = key.toLowerCase().split("+");
        const mainKey = parts[parts.length - 1];
        const needsCtrl = parts.includes("ctrl") || parts.includes("cmd");
        const needsShift = parts.includes("shift");
        const needsAlt = parts.includes("alt");

        const ctrlMatch = needsCtrl ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = needsShift ? e.shiftKey : true;
        const altMatch = needsAlt ? e.altKey : true;

        const keyMatch = e.key.toLowerCase() === mainKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (isInput && mainKey !== "escape") continue;
          e.preventDefault();
          handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutMap>({});

  const register = useCallback((map: ShortcutMap) => {
    setShortcuts((prev) => ({ ...prev, ...map }));
  }, []);

  useKeyboardShortcuts(shortcuts);

  return <ShortcutsContext.Provider value={shortcuts}>{children}</ShortcutsContext.Provider>;
}

export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shortcuts = useShortcutsContext();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const grouped = Object.entries(shortcuts).map(([key, { description }]) => ({
    key,
    description,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-paper p-6 shadow-modal">
        <h3 className="mb-4 text-lg font-medium text-ink">Keyboard Shortcuts</h3>
        <div className="space-y-2">
          {grouped.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-charcoal">{s.description}</span>
              <kbd className="rounded-md border border-hairline bg-surface px-2 py-0.5 text-xs font-mono text-graphite">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-md border border-hairline bg-canvas py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
        >
          Close
        </button>
      </div>
    </div>
  );
}
