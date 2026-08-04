import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@package/ui/components/sidebar";

import {
  Search,
  Bell,
  MessageCircle,
  Bookmark,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Home,
} from "lucide-react";

import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth-client";

const routes = [
  {
    title: "Home",
    icon: Home,
    to: "/dashboard/home",
  },
  {
    title: "Explore",
    icon: Search,
    to: "/dashboard/explore",
  },
  {
    title: "Notifications",
    icon: Bell,
    to: "/dashboard/notifications",
  },
  {
    title: "Messages",
    icon: MessageCircle,
    to: "/dashboard/messages",
  },
  {
    title: "Bookmarks",
    icon: Bookmark,
    to: "/dashboard/bookmarks",
  },
  {
    title: "Profile",
    icon: User,
    to: "/dashboard/profile",
    params: {
      username: "piyush",
    },
  },
  {
    title: "Settings",
    icon: Settings,
    to: "/dashboard/settings",
  },
];

export function AppSidebar() {
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <HelpCircle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.title}>
                <SidebarMenuButton render={<Link to={route.to} />}>
                  <route.icon />
                  <span>{route.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
