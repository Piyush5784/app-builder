import { Spinner } from "@package/ui/components/spinner";
import { MultiStepLoader } from "@package/ui/components/multi-step-loader";
import type { ChatItem } from "@/routes/dashboard/build/-types";
import { toolLabel } from "@/routes/dashboard/build/-activity-row";

const SANDBOX_LOADING_STATES = [
  { text: "Spinning up sandbox" },
  { text: "Installing dependencies" },
  { text: "Starting dev server" },
  { text: "Waiting for preview" },
];
export function PreviewPane({
  previewUrl,
  isFetching,
  isError,
  items,
}: {
  previewUrl: string | null | undefined;
  isFetching: boolean;
  isError: boolean;
  items: ChatItem[];
}) {
  const liveActivitySteps = items.filter(
    (item): item is Extract<ChatItem, { kind: "activity" }> =>
      item.kind === "activity",
  );
  const loadingStates =
    liveActivitySteps.length > 0
      ? liveActivitySteps.map((item) => ({
          text: toolLabel(item.activity.tool, item.activity.args),
        }))
      : SANDBOX_LOADING_STATES;
  const loadingValue =
    liveActivitySteps.length > 0
      ? Math.max(
          0,
          liveActivitySteps.findLastIndex(
            (item) => item.activity.status !== "pending",
          ) + 1,
        )
      : undefined;

  return (
    <div className="relative min-h-0 flex-1 bg-muted">
      {previewUrl ? (
        <>
          <iframe
            src={previewUrl}
            loading="eager"
            referrerPolicy="no-referrer"
            allowFullScreen
            className="size-full border-0"
            title="Live preview"
          />
          {isFetching && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <Spinner className="size-5" />
            </div>
          )}
        </>
      ) : isError ? (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          Failed to load sandbox
        </div>
      ) : (
        <MultiStepLoader
          loading
          loop={loadingValue === undefined}
          duration={1500}
          loadingStates={loadingStates}
          value={loadingValue}
          className="absolute inset-0"
        />
      )}
    </div>
  );
}
