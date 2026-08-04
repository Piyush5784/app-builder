import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";

function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left panel */}
      <div className="flex h-screen flex-col bg-muted p-1">
        <div className="flex h-screen flex-col items-center justify-center rounded-xl border bg-background">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            My App
          </a>
          <div className="w-full max-w-md rounded-2xl p-8">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Right panel — nature image */}
      <div className="hidden h-screen lg:block">
        <img
          src="https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1400"
          alt="Nature"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});
