import { RemindersList } from "@/components/reminders-list";
import { Sidebar } from "@/components/sidebar";

export default function RemindersPage() {
  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-auto pl-0 lg:pl-56">
        <RemindersList />
      </main>
    </div>
  );
}
