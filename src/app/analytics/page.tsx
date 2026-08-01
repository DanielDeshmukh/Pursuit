import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-ink">
            Pursuit
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/tracker"
              className="text-sm text-charcoal hover:text-ink"
            >
              Tracker
            </Link>
            <span className="text-sm font-medium text-primary">
              Analytics
            </span>
            <Link
              href="/reminders"
              className="text-sm text-charcoal hover:text-ink"
            >
              Reminders
            </Link>
            <Link
              href="/outreach"
              className="text-sm text-charcoal hover:text-ink"
            >
              Outreach
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </header>

      <AnalyticsDashboard />
    </div>
  );
}
