import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  SparklesIcon,
  ZapIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Badge } from "@package/ui/components/badge";
import { Button } from "@package/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@package/ui/components/card";
import { Separator } from "@package/ui/components/separator";

const FEATURES = [
  {
    icon: SparklesIcon,
    title: "shadcn/ui, pre-installed",
    description: "Every component is already here — just import and use.",
  },
  {
    icon: ZapIcon,
    title: "Tailwind v4",
    description: "CSS-first config, no build step to fight with.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Type-safe by default",
    description: "React + TypeScript + Vite, wired up and ready.",
  },
];

function SandboxPreview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">
          Built with shadcn/ui
        </Badge>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Tell the assistant what you want to build
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          This page updates as you describe what you want. Ask for a landing
          page, a dashboard, a form — anything.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg">
            Get started
            <ArrowRightIcon />
          </Button>
          <Button size="lg" variant="outline">
            Learn more
          </Button>
        </div>

        <Separator className="my-16" />

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="text-left">
              <CardHeader>
                <feature.icon className="size-5 text-muted-foreground" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sandbox-preview")({
  component: SandboxPreview,
});
