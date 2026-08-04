import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/utils/axios";
import { invalidateQueriesForTable } from "@/utils/query-cache";
import { Textarea } from "@package/ui/components/textarea";
import { Button } from "@package/ui/components/button";
import { Spinner } from "@package/ui/components/spinner";
import { ArrowUpIcon } from "lucide-react";
import { WebglMorph } from "@/components/custom/webgl-morph/webgl-morph";

interface PromptResponse {
  sessionId: string;
  previewUrl: string;
}

const EXAMPLE_PROMPTS = [
  "A landing page for a coffee subscription box",
  "A pricing page with three tiers and a toggle for monthly/yearly",
  "A dashboard with a sidebar and a table of recent orders",
];

function Dashboard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = React.useState("");

  const submit = useMutation({
    mutationFn: async (value: string) => {
      const res = await api.post<{ data: PromptResponse }>("/agent/prompt", {
        prompt: value,
      });
      return res.data.data;
    },
    onSuccess: (data, value) => {
      invalidateQueriesForTable("AgentSession");
      navigate({
        to: "/dashboard/build/$sessionId",
        params: { sessionId: data.sessionId },
        search: { q: value },
      });
    },
  });

  const handleSubmit = () => {
    const value = prompt.trim();
    if (!value || submit.isPending) return;
    submit.mutate(value);
  };

  return (
    <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 px-4">
      <WebglMorph position="background" />
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          What do you want to build?
        </h1>
        <p className="text-muted-foreground">
          Describe an app or page and it'll be generated for you in a live
          sandbox.
        </p>
      </div>

      <div className="w-full space-y-3">
        <div className="relative">
          <Textarea
            autoFocus
            placeholder="Build a landing page for..."
            value={prompt}

            disabled={submit.isPending}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="min-h-28 resize-none pr-12 text-base"
          />
          <Button
            size="icon-sm"
            className="absolute bottom-2.5 right-2.5"
            disabled={!prompt.trim() || submit.isPending}
            onClick={handleSubmit}
          >
            {submit.isPending ? <Spinner /> : <ArrowUpIcon />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              disabled={submit.isPending}
              onClick={() => setPrompt(example)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});
