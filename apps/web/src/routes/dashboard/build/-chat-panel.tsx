import { Textarea } from "@package/ui/components/textarea";
import { Button } from "@package/ui/components/button";
import { Spinner } from "@package/ui/components/spinner";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@package/ui/components/message-scroller";
import { Message, MessageContent } from "@package/ui/components/message";
import { Bubble, BubbleContent } from "@package/ui/components/bubble";
import { Streamdown, type PluginConfig } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import type { ChatItem, ModelInfo } from "@/routes/dashboard/build/-types";
import { ActivityRow } from "@/routes/dashboard/build/-activity-row";
import { ModelPicker } from "@/routes/dashboard/build/-model-picker";
const streamdownPlugins = { cjk, code, math, mermaid } as PluginConfig;

export function ChatPanel({
  items,
  isGenerating,
  isLoadingHistory,
  prompt,
  setPrompt,
  handleSend,
  cancelGeneration,
  modelsQuery,
  selectedModelId,
  setSelectedModelId,
  credits,
}: {
  items: ChatItem[];
  isGenerating: boolean;
  isLoadingHistory: boolean;
  prompt: string;
  setPrompt: (value: string) => void;
  handleSend: () => void;
  cancelGeneration: { mutate: () => void; isPending: boolean };
  modelsQuery: { data: ModelInfo[] | undefined };
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  credits: number;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {isLoadingHistory ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" /> Loading chat…
        </div>
      ) : (
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="min-h-0 flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent className="px-4 py-4">
                {items.map((item) => {
                  if (item.kind === "activity") {
                    return (
                      <MessageScrollerItem key={item.id}>
                        <ActivityRow activity={item.activity} />
                      </MessageScrollerItem>
                    );
                  }
                  return (
                    <MessageScrollerItem key={item.id}>
                      <Message align={item.kind === "user" ? "end" : "start"}>
                        <MessageContent>
                          <Bubble
                            align={item.kind === "user" ? "end" : "start"}
                            variant={
                              item.kind === "user"
                                ? "default"
                                : item.kind === "error"
                                  ? "destructive"
                                  : "muted"
                            }
                          >
                            <BubbleContent>
                              {item.kind === "assistant" ? (
                                <Streamdown
                                  mode="static"
                                  plugins={streamdownPlugins}
                                >
                                  {item.content}
                                </Streamdown>
                              ) : (
                                item.content
                              )}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  );
                })}
                {isGenerating && (
                  <MessageScrollerItem>
                    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                      <Spinner className="size-3.5" /> Thinking...
                    </div>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      )}

      <div className="border-t border-border p-3">
        <div className="relative">
          <Textarea
            placeholder="Ask for a change..."
            value={prompt}
            disabled={isGenerating}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              if (e.key === "Escape" && isGenerating) {
                cancelGeneration.mutate();
              }
            }}
            className="min-h-20 resize-none pr-12 pb-9 text-sm"
          />
          {modelsQuery.data && (
            <div className="absolute bottom-2 left-2">
              <ModelPicker
                models={modelsQuery.data}
                value={selectedModelId}
                onChange={setSelectedModelId}
                credits={credits}
                disabled={isGenerating}
              />
            </div>
          )}
          {isGenerating ? (
            <Button
              size="icon-sm"
              className="absolute right-2 bottom-2"
              disabled={cancelGeneration.isPending}
              onClick={() => cancelGeneration.mutate()}
              title="Stop generating (Esc)"
            >
              <SquareIcon className="fill-current" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              className="absolute right-2 bottom-2"
              disabled={!prompt.trim()}
              onClick={handleSend}
            >
              <ArrowUpIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
