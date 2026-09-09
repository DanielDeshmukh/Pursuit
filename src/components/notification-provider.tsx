"use client";

import { useNotifications } from "@/lib/use-notifications";

export function NotificationProvider() {
  useNotifications();
  return null;
}
