"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@package/ui/components/hover-card";
import { cn } from "@package/ui/lib/utils";
import { createContext, useContext } from "react";

const SourceContext = createContext<{
  href: string;
  domain: string;
} | null>(null);

function useSourceContext() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error("Source.* must be used inside <Source>");
  return ctx;
}

export type SourceProps = {
  href: string;
  children: React.ReactNode;
};

function getDomain(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return href.split("/").pop() || href;
  }
}

export function Source({ href, children }: SourceProps) {
  const domain = getDomain(href);

  return (
    <SourceContext.Provider value={{ href, domain }}>
      {/* Base UI's PreviewCard doesn't expose configurable open/close delay props */}
      <HoverCard>{children}</HoverCard>
    </SourceContext.Provider>
  );
}

export type SourceTriggerProps = {
  label?: string | number;
  showFavicon?: boolean;
  className?: string;
};

export function SourceTrigger({
  label,
  showFavicon = false,
  className,
}: SourceTriggerProps) {
  const { href, domain } = useSourceContext();
  const labelToShow = label ?? domain.replace("www.", "");

  return (
    <HoverCardTrigger
      render={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-5 max-w-32 items-center gap-1 overflow-hidden rounded-full bg-muted py-0 text-xs text-muted-foreground no-underline transition-colors duration-150 hover:bg-muted-foreground/30 hover:text-primary",
            showFavicon ? "pr-2 pl-1" : "px-1",
            className,
          )}
        />
      }
    >
      {showFavicon && (
        <img
          src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
            href,
          )}`}
          alt="favicon"
          width={14}
          height={14}
          className="size-3.5 rounded-full"
        />
      )}
      <span className="truncate text-center font-normal tabular-nums">
        {labelToShow}
      </span>
    </HoverCardTrigger>
  );
}

export type SourceContentProps = {
  title: string;
  description: string;
  className?: string;
};

export function SourceContent({
  title,
  description,
  className,
}: SourceContentProps) {
  const { href, domain } = useSourceContext();

  return (
    <HoverCardContent className={cn("w-80 p-0 shadow-xs", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-2 p-3"
      >
        <div className="flex items-center gap-1.5">
          <img
            src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
              href,
            )}`}
            alt="favicon"
            className="size-4 rounded-full"
            width={16}
            height={16}
          />
          <div className="truncate text-sm text-primary">
            {domain.replace("www.", "")}
          </div>
        </div>
        <div className="line-clamp-2 text-sm font-medium">{title}</div>
        <div className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </div>
      </a>
    </HoverCardContent>
  );
}
