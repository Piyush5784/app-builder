import { Textarea } from "@package/ui/components/textarea";
import { Button } from "@package/ui/components/button";
import { Spinner } from "@package/ui/components/spinner";
import { ArrowUpIcon } from "lucide-react";
import type { ModelInfo } from "@/routes/dashboard/build/-types";
import { ModelPicker } from "@/routes/dashboard/build/-model-picker";

const EXAMPLE_PROMPTS = [
  "A landing page for a coffee subscription box",
  "A pricing page with three tiers and a toggle for monthly/yearly",
  "A dashboard with a sidebar and a table of recent orders",
];

// The empty-state screen shown for a session that hasn't sent its first
// prompt yet — replaced by the chat/workspace views once it has.
export function ChatInput({
  prompt,
  setPrompt,
  isGenerating,
  handleSend,
  modelsQuery,
  selectedModelId,
  setSelectedModelId,
  credits,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  isGenerating: boolean;
  handleSend: () => void;
  modelsQuery: { data: ModelInfo[] | undefined };
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  credits: number;
}) {
  return (
    <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 px-4">
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
            disabled={isGenerating}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-28 resize-none pr-12 pb-11"
          />
          {modelsQuery.data && (
            <div className="absolute bottom-2.5 left-2.5 text-foreground">
              <ModelPicker
                models={modelsQuery.data}
                value={selectedModelId}
                onChange={setSelectedModelId}
                credits={credits}
                disabled={isGenerating}
              />
            </div>
          )}
          <Button
            size="icon-sm"
            className="absolute right-2.5 bottom-2.5"
            disabled={!prompt.trim() || isGenerating}
            onClick={handleSend}
          >
            {isGenerating ? <Spinner /> : <ArrowUpIcon />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              disabled={isGenerating}
              onClick={() => setPrompt(example)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
