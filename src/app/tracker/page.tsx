import { KanbanBoard } from "@/components/kanban-board";
import { Sidebar } from "@/components/sidebar";

export default function TrackerPage() {
  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-hidden pl-0 lg:pl-56 data-[collapsed=true]:lg:pl-16">
        <KanbanBoard />
      </main>
    </div>
  );
}
