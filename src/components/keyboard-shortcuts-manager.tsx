"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";
import { KeyboardShortcutsHelp } from "@/lib/use-keyboard-shortcuts";

const navShortcuts = [
  { key: "1", path: "/tracker", label: "Tracker" },
  { key: "2", path: "/analytics", label: "Analytics" },
  { key: "3", path: "/reminders", label: "Reminders" },
  { key: "4", path: "/outreach", label: "Outreach" },
  { key: "5", path: "/contacts", label: "Contacts" },
  { key: "6", path: "/profile", label: "Profile" },
];

export function KeyboardShortcutsManager() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Record<string, { description: string; handler: () => void }> = {};

  navShortcuts.forEach(({ key, path, label }) => {
    shortcuts[key] = {
      description: `Go to ${label}`,
      handler: () => router.push(path),
    };
  });

  shortcuts["?"] = {
    description: "Show keyboard shortcuts",
    handler: () => setShowHelp(true),
  };

  shortcuts["escape"] = {
    description: "Close modals / panels",
    handler: () => setShowHelp(false),
  };

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setShowHelp((prev) => !prev);
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return <KeyboardShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />;
}
