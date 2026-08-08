import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@package/ui/components/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "./-app-sidebar";
import { authClient } from "@/lib/auth-client";

function FixedSidebarTrigger() {
  const { state, isMobile } = useSidebar();
  const offsetLeft =
    !isMobile && state === "expanded"
      ? "calc(var(--sidebar-width) + 0.5rem)"
      : "0.5rem";

  return (
    <SidebarTrigger
      className="fixed top-2 z-50 transition-[left] duration-200 ease-linear"
      style={{ left: offsetLeft }}
    />
  );
}

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="h-screen w-full overflow-hidden">
        <FixedSidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data?.user) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: DashboardLayout,
});
