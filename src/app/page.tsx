import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-canvas font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-medium tracking-tight text-ink">
            Pursuit
          </h1>
          <p className="text-lg text-charcoal">
            Your job search, tracked, automated, and actually organized.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/tracker"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-deep"
          >
            Get Started
          </Link>
          <button className="rounded-md border border-primary bg-canvas px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary-soft">
            Learn More
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-hairline bg-paper p-6 shadow-card">
            <h3 className="mb-2 text-sm font-medium text-ink">Tracker</h3>
            <p className="text-sm text-charcoal">
              Kanban board to track every application from saved to offer.
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-paper p-6 shadow-card">
            <h3 className="mb-2 text-sm font-medium text-ink">Analytics</h3>
            <p className="text-sm text-charcoal">
              See which channels convert and where to focus.
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-paper p-6 shadow-card">
            <h3 className="mb-2 text-sm font-medium text-ink">Outreach</h3>
            <p className="text-sm text-charcoal">
              Draft personalized messages that actually get replies.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
