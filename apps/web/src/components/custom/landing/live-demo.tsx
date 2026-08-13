import { AlertTriangle, TerminalSquare } from "lucide-react";
import {
  Section,
  SectionHeading,
  WindowChrome,
  useScrollLines,
} from "./shared";

type Line = {
  text: string;
  tone?: "cmd" | "muted" | "error" | "agent" | "success";
};

const LINES: Line[] = [
  { text: "$ npm install", tone: "cmd" },
  { text: "added 214 packages in 6.2s", tone: "muted" },
  { text: "$ npm run dev", tone: "cmd" },
  { text: "vite v5.4.0 dev server running at :3000", tone: "muted" },
  { text: "$ npm run build", tone: "cmd" },
  { text: "vite building for production…", tone: "muted" },
  { text: 'Error: Module not found "@/components/Navbar"', tone: "error" },
  { text: "  at src/App.tsx:4:23", tone: "muted" },
  { text: "Analyzing error…", tone: "agent" },
  { text: "Inspecting project files…", tone: "agent" },
  { text: "Found mismatched import path in src/App.tsx", tone: "agent" },
  { text: "Applying fix…", tone: "agent" },
  { text: "$ npm run build", tone: "cmd" },
  { text: "vite building for production…", tone: "muted" },
  { text: "✓ 142 modules transformed", tone: "muted" },
  { text: "✓ Build successful", tone: "success" },
];

function toneClass(tone?: Line["tone"]) {
  switch (tone) {
    case "cmd":
      return "text-foreground/70";
    case "error":
      return "text-red-600 dark:text-red-400";
    case "agent":
      return "text-sky-600 dark:text-sky-300/90";
    case "success":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return "text-muted-foreground";
  }
}

export function LiveDemo() {
  const { containerRef, setLineRef } = useScrollLines<HTMLDivElement>(
    LINES.length,
  );

  return (
    <Section id="live-demo">
      <SectionHeading
        kicker="Live agent demo"
        title="Don't just generate code. Build software."
        description="The agent doesn't hand you a snippet and walk away — it actually operates a development environment: installing, running, reading errors, and fixing them."
      />

      <div className="mx-auto mt-14 max-w-3xl">
        <WindowChrome
          label="terminal — agent session"
          icon={<TerminalSquare className="size-3" />}
        >
          <div
            ref={containerRef}
            className="min-h-120 space-y-2 p-6 font-mono text-[13px]"
          >
            {LINES.map((line, i) => (
              <div
                key={i}
                ref={setLineRef(i)}
                className={`flex items-center gap-2 ${toneClass(line.tone)}`}
              >
                {line.tone === "error" ? (
                  <AlertTriangle className="size-3.5 shrink-0" />
                ) : null}
                {line.text}
              </div>
            ))}
          </div>
        </WindowChrome>
      </div>
    </Section>
  );
}
