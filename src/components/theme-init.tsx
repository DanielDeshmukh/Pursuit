"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = theme === "dark" || (!theme && systemDark) ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", resolved);
    } catch {}
  }, []);

  return null;
}
