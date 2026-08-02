"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getApplications } from "@/lib/actions/applications";
import { getReminders, type ReminderWithApp } from "@/lib/actions/reminders";
import { SidebarLayout } from "@/components/sidebar-layout";
import { LoadingScreen } from "@/components/loading-screen";
import { STATUS_COLUMNS, type ApplicationWithRelations } from "@/lib/types";

export default function Home() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [reminders, setReminders] = useState<ReminderWithApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getApplications(), getReminders()]).then(([apps, rems]) => {
      setApplications(apps);
      setReminders(rems);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SidebarLayout>
        <LoadingScreen />
      </SidebarLayout>
    );
  }

  const statusCounts = STATUS_COLUMNS.map((col) => ({
    ...col,
    count: applications.filter((a) => a.status === col.id).length,
  }));

  const pendingReminders = reminders
    .filter((r) => !r.done)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5);

  const overdueCount = reminders.filter(
    (r) => !r.done && new Date(r.dueAt) < new Date()
  ).length;

  const recentApps = [...applications]
    .sort((a, b) => {
      const aDate = a.appliedAt ?? "";
      const bDate = b.appliedAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 5);

  return (
    <SidebarLayout>
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-ink">Dashboard</h1>
          <p className="text-sm text-charcoal">
            {applications.length} application{applications.length !== 1 ? "s" : ""} tracked
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {statusCounts.map((s) => (
            <Link
              key={s.id}
              href="/tracker"
              className="rounded-xl border border-hairline bg-paper p-3 text-center transition-colors hover:shadow-card"
            >
              <p className="text-xl font-semibold text-ink">{s.count}</p>
              <p className="text-[10px] text-graphite">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-hairline bg-paper p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">Upcoming Reminders</h3>
              {overdueCount > 0 && (
                <span className="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-medium text-error">
                  {overdueCount} overdue
                </span>
              )}
            </div>
            {pendingReminders.length === 0 ? (
              <p className="py-6 text-center text-sm text-graphite">
                No pending reminders
              </p>
            ) : (
              <div className="space-y-2">
                {pendingReminders.map((r) => {
                  const isOverdue = new Date(r.dueAt) < new Date();
                  return (
                    <Link
                      key={r.id}
                      href="/reminders"
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:shadow-card ${
                        isOverdue
                          ? "border-error/30 bg-error/5"
                          : "border-hairline bg-canvas"
                      }`}
                    >
                      <div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            r.type === "follow_up"
                              ? "bg-primary/10 text-primary"
                              : r.type === "interview_prep"
                                ? "bg-storm-mist/20 text-storm-deep"
                                : "bg-bloom-rose/30 text-bloom-deep"
                          }`}
                        >
                          {r.type.replace("_", " ")}
                        </span>
                        <p className="mt-1 text-xs text-charcoal">
                          {r.jobTitle} @ {r.companyName}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] ${
                          isOverdue ? "font-medium text-error" : "text-graphite"
                        }`}
                      >
                        {new Date(r.dueAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-hairline bg-paper p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">Recent Applications</h3>
              <Link href="/tracker" className="text-xs text-primary hover:text-primary-deep">
                View all
              </Link>
            </div>
            {recentApps.length === 0 ? (
              <p className="py-6 text-center text-sm text-graphite">
                No applications yet.{" "}
                <Link href="/tracker" className="text-primary hover:text-primary-deep">
                  Add your first one
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href="/tracker"
                    className="flex items-center justify-between rounded-lg border border-hairline bg-canvas p-3 transition-colors hover:shadow-card"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {app.jobTitle}
                      </p>
                      <p className="text-xs text-charcoal">{app.company.name}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        app.status === "OFFER"
                          ? "bg-bloom-rose/30 text-bloom-deep"
                          : app.status === "INTERVIEW"
                            ? "bg-storm-mist/20 text-storm-deep"
                            : "bg-cloud text-charcoal"
                      }`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
