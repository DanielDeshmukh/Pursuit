"use client";

import { useEffect, useRef } from "react";
import { getReminders } from "@/lib/actions/reminders";

export function useNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    async function checkReminders() {
      if (Notification.permission !== "granted") return;

      try {
        const reminders = await getReminders();
        const now = new Date();

        for (const r of reminders) {
          if (r.done) continue;
          if (notifiedRef.current.has(r.id)) continue;

          const due = new Date(r.dueAt);
          if (due <= now) {
            notifiedRef.current.add(r.id);
            new Notification(`Reminder: ${r.type}`, {
              body: `${r.jobTitle} @ ${r.companyName}`,
              icon: "/badge.svg",
              tag: r.id,
            });
          }
        }
      } catch {
        // silent fail
      }
    }

    checkReminders();
    intervalRef.current = setInterval(checkReminders, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}

export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}
