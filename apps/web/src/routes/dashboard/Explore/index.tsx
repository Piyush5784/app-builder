import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/Explore/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/Explore/"!</div>;
}
