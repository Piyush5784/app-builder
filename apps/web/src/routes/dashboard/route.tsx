import {
  SidebarProvider,
  SidebarTrigger,
} from "@package/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./-app-sidebar";

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});
