import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Sidebar } from "@/components/sidebar";

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-auto pl-0 lg:pl-56">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
