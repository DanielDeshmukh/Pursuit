import { RemindersList } from "@/components/reminders-list";
import { SidebarLayout } from "@/components/sidebar-layout";

export default function RemindersPage() {
  return (
    <SidebarLayout>
      <RemindersList />
    </SidebarLayout>
  );
}
