import { KanbanBoard } from "@/components/kanban-board";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function TrackerPage() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-ink">
            Pursuit
          </Link>
          <nav className="flex gap-4">
            <span className="text-sm font-medium text-primary">Tracker</span>
            <span className="text-sm text-charcoal hover:text-ink cursor-pointer">
              Analytics
            </span>
          </nav>
        </div>
        <ThemeToggle />
      </header>

      <KanbanBoard />
    </div>
  );
}
