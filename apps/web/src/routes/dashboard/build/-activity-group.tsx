import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { Spinner } from "@package/ui/components/spinner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@package/ui/components/accordion";
import { cn } from "@package/ui/lib/utils";
import type { ActivityEntry, ChatItem } from "@/routes/dashboard/build/-types";
import { ActivityRow, toolLabel } from "@/routes/dashboard/build/-activity-row";

type NonActivityItem = Exclude<ChatItem, { kind: "activity" }>;
type ActivityGroupItem = {
  kind: "activity-group";
  activities: ActivityEntry[];
};
export type GroupedChatItem = NonActivityItem | ActivityGroupItem;

export function groupConsecutiveActivities(
  items: ChatItem[],
): GroupedChatItem[] {
  const grouped: GroupedChatItem[] = [];

  for (const item of items) {
    if (item.kind === "activity") {
      const last = grouped.at(-1);
      if (last && last.kind === "activity-group") {
        last.activities.push(item.activity);
        continue;
      }
      grouped.push({ kind: "activity-group", activities: [item.activity] });
      continue;
    }
    grouped.push(item);
  }

  return grouped;
}

function summarizeGroup(activities: ActivityEntry[]): string {
  const last = activities.at(-1)!;
  if (activities.length === 1) return toolLabel(last.tool, last.args);
  return `${toolLabel(last.tool, last.args)} (+${activities.length - 1} more)`;
}

export function ActivityGroup({ activities }: { activities: ActivityEntry[] }) {
  const isLoading = activities.some((a) => a.status === "pending");
  const hasError = activities.some((a) => a.status === "error");
  const [isExpanded, setIsExpanded] = React.useState(isLoading);
  const wasLoadingRef = React.useRef(isLoading);

  React.useEffect(() => {
    if (isLoading && !wasLoadingRef.current) {
      setIsExpanded(true);
    } else if (!isLoading && wasLoadingRef.current) {
      setIsExpanded(hasError);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, hasError]);

  if (activities.length === 1) {
    return <ActivityRow activity={activities[0]} />;
  }

  return (
    <Accordion
      value={isExpanded ? ["activity-group"] : []}
      onValueChange={(value) => setIsExpanded(value.length > 0)}
    >
      <AccordionItem value="activity-group" className="border-b-0">
        <AccordionTrigger
          className={cn(
            "gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-normal text-muted-foreground hover:no-underline",
            "[&>svg:last-child]:hidden",
          )}
        >
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              isExpanded && "rotate-90",
            )}
          />
          <span className="min-w-0 flex-1 truncate text-left">
            {summarizeGroup(activities)}
          </span>
          {isLoading ? (
            <Spinner className="size-3.5 shrink-0" />
          ) : (
            <span className="shrink-0 text-[10px] opacity-60">
              {activities.length} steps
            </span>
          )}
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div className="flex flex-col gap-1.5 border-l border-border py-1.5 pl-3">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
