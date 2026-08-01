"use client";

import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";

function SidebarLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />
      <main
        className={`flex-1 overflow-auto transition-all duration-200 ${
          collapsed ? "lg:pl-16" : "lg:pl-56"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarLayoutInner>{children}</SidebarLayoutInner>
    </SidebarProvider>
  );
}
