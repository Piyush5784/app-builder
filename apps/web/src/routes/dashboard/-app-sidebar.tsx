import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@package/ui/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@package/ui/components/dropdown-menu";
import { Input } from "@package/ui/components/input";

import {
  Settings,
  LogOut,
  Sparkles,
  Plus,
  MessagesSquare,
  MoreHorizontal,
  Trash2,
  PencilLine,
  Sun,
  Moon,
} from "lucide-react";

import * as React from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/auth-client";
import { useModelQuery } from "@/hooks/use-model-queries";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/utils/axios";
import { invalidateQueriesForTable } from "@/utils/query-cache";
import { useUser } from "@/hooks/use-user";

function ThemeToggle() {
  const { setTheme } = useTheme();
  const resolvedTheme = useResolvedTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setTheme(isDark ? "light" : "dark")}>
        {isDark ? <Sun /> : <Moon />}
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { sessionId: activeSessionId } = useParams({ strict: false });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState("");

  const handleLogout = async () => {
    await signOut();
  };

  const { data: sessions } = useModelQuery("AgentSession").useFindMany({
    where: { userId: user?.user.id },
    select: { id: true, name: true, lastActiveAt: true },
    orderBy: { lastActiveAt: "desc" },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/agent/sessions/${sessionId}`);
    },
    onSuccess: (_data, sessionId) => {
      invalidateQueriesForTable("AgentSession");
      if (activeSessionId === sessionId) {
        navigate({
          to: "/dashboard/build/$sessionId",
          params: { sessionId: "new" },
        });
      }
    },
  });

  const renameSession = useMutation({
    mutationFn: async ({
      sessionId,
      name,
    }: {
      sessionId: string;
      name: string;
    }) => {
      await api.patch(`/agent/sessions/${sessionId}`, { name });
    },
    onSuccess: () => invalidateQueriesForTable("AgentSession"),
  });

  const startEditing = (sessionId: string, currentName: string) => {
    setEditingId(sessionId);
    setEditingValue(currentName);
  };

  const commitEditing = () => {
    const value = editingValue.trim();
    if (editingId && value) {
      renameSession.mutate({ sessionId: editingId, name: value });
    }
    setEditingId(null);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  to="/dashboard/build/$sessionId"
                  params={{ sessionId: "new" }}
                />
              }
            >
              <Sparkles />
              <span>App Builder</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link
                    to="/dashboard/build/$sessionId"
                    params={{ sessionId: "new" }}
                  />
                }
              >
                <Plus />
                <span>New build</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sessions</SidebarGroupLabel>
          <SidebarMenu>
            {sessions?.length === 0 && (
              <SidebarMenuItem>
                <span className="px-2 text-xs text-muted-foreground">
                  No builds yet
                </span>
              </SidebarMenuItem>
            )}
            {sessions?.map((session) => {
              const displayName =
                session.name ?? `Session ${session.id.slice(0, 8)}`;
              const isEditing = editingId === session.id;

              return (
                <SidebarMenuItem key={session.id} className="group/menu-item">
                  {isEditing ? (
                    <div className="flex items-center gap-2 px-2 py-1">
                      <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={commitEditing}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEditing();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-6 px-1 text-sm"
                      />
                    </div>
                  ) : (
                    <SidebarMenuButton
                      render={
                        <Link
                          to="/dashboard/build/$sessionId"
                          params={{ sessionId: session.id }}
                        />
                      }
                    >
                      <MessagesSquare />
                      <span className="truncate">{displayName}</span>
                    </SidebarMenuButton>
                  )}

                  {!isEditing && (
                    <DropdownMenu>
                      <SidebarMenuAction
                        showOnHover
                        render={<DropdownMenuTrigger />}
                      >
                        <MoreHorizontal />
                      </SidebarMenuAction>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          onClick={() => startEditing(session.id, displayName)}
                        >
                          <PencilLine />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={deleteSession.isPending}
                          onClick={() => deleteSession.mutate(session.id)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <ThemeToggle />
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/dashboard/Settings" />}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
