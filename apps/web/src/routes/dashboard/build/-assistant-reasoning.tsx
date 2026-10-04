import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@package/ui/components/accordion";
import { Streamdown, type PluginConfig } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cn } from "@package/ui/lib/utils";

const streamdownPlugins = { cjk, code, math, mermaid } as PluginConfig;

export function AssistantReasoning({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(isStreaming);
  const wasStreamingRef = React.useRef(isStreaming);

  React.useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      setIsExpanded(true);
    } else if (!isStreaming && wasStreamingRef.current) {
      setIsExpanded(false);
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  return (
    <Accordion
      value={isExpanded ? ["reasoning"] : []}
      onValueChange={(value) => setIsExpanded(value.length > 0)}
    >
      <AccordionItem value="reasoning" className="border-b-0">
        <AccordionTrigger
          className={cn(
            "gap-2 px-1 py-1 text-xs font-normal text-muted-foreground hover:no-underline",
            "[&>svg:last-child]:hidden",
          )}
        >
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              isExpanded && "rotate-90",
            )}
          />
          <span className={cn(isStreaming && "animate-pulse")}>
            {isStreaming ? "Thinking" : "Thought"}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div className="max-h-[200px] overflow-y-auto border-l border-border py-1 pl-3 text-xs text-muted-foreground [&_*]:text-xs">
            <Streamdown mode="static" plugins={streamdownPlugins}>
              {content}
            </Streamdown>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
