import { KanbanBoard } from "@/components/kanban-board";
import { SidebarLayout } from "@/components/sidebar-layout";

export default function TrackerPage() {
  return (
    <SidebarLayout>
      <KanbanBoard />
    </SidebarLayout>
  );
}
