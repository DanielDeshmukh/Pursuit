import { OutreachDashboard } from "@/components/outreach-dashboard";
import { Sidebar } from "@/components/sidebar";

export default function OutreachPage() {
  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-auto pl-0 lg:pl-56">
        <OutreachDashboard />
      </main>
    </div>
  );
}
