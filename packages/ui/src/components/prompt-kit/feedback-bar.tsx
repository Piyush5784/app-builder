import { cn } from "@package/ui/lib/utils";
import { ThumbsDown, ThumbsUp, X } from "lucide-react";

type FeedbackBarProps = {
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onClose?: () => void;
};

export function FeedbackBar({
  className,
  title,
  icon,
  onHelpful,
  onNotHelpful,
  onClose,
}: FeedbackBarProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-[12px] border border-border bg-background text-sm",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-1 items-center justify-start gap-4 py-3 pl-4">
          {icon}
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center justify-center gap-0.5 px-3 py-0">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Helpful"
            onClick={onHelpful}
          >
            <ThumbsUp className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Not helpful"
            onClick={onNotHelpful}
          >
            <ThumbsDown className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-center border-l border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-md p-3 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
