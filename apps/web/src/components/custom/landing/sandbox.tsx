import {
  FolderTree,
  FileCode2,
  TerminalSquare,
  Globe,
  ScrollText,
  Bot,
} from "lucide-react";
import {
  Reveal,
  Section,
  SectionHeading,
  WindowChrome,
  useScrollLines,
} from "./shared";

const FILES = [
  { name: "src", type: "dir" },
  { name: "  components", type: "dir" },
  { name: "    Navbar.tsx", type: "file", active: true },
  { name: "    Sidebar.tsx", type: "file" },
  { name: "    TaskCard.tsx", type: "file" },
  { name: "  pages", type: "dir" },
  { name: "    Dashboard.tsx", type: "file" },
  { name: "    Projects.tsx", type: "file" },
  { name: "  lib", type: "dir" },
  { name: "    auth.ts", type: "file" },
  { name: "    db.ts", type: "file" },
  { name: "  App.tsx", type: "file" },
  { name: "package.json", type: "file" },
  { name: "tsconfig.json", type: "file" },
  { name: ".env", type: "file" },
];

const CODE_LINES = [
  { t: "// src/components/Navbar.tsx", c: "text-muted-foreground/60" },
  { t: "", c: "" },
  { t: "import", c: "text-sky-600 dark:text-sky-400" },
  { t: " { Link } ", c: "text-foreground/70" },
  { t: "from", c: "text-sky-600 dark:text-sky-400" },
  { t: ' "react-router-dom"', c: "text-emerald-600 dark:text-emerald-400" },
  { t: ";", c: "text-foreground/40" },
];

const TERMINAL_LINES = [
  { text: "$ npm install", tone: "text-foreground/70" },
  { text: "added 214 packages in 6s", tone: "text-muted-foreground" },
  { text: "$ npm run dev", tone: "text-foreground/70" },
  { text: "vite v5.4.0 dev server", tone: "text-muted-foreground" },
  { text: "➜ ready on :3000", tone: "text-emerald-600 dark:text-emerald-400" },
  { text: "watching for file changes…", tone: "text-muted-foreground" },
];

export function SandboxSection() {
  const { containerRef, setLineRef } = useScrollLines<HTMLDivElement>(
    TERMINAL_LINES.length,
  );

  return (
    <Section id="sandbox">
      <SectionHeading
        kicker="The sandbox"
        title="A real development environment for your AI agent."
        description="The agent doesn't just suggest code. It works inside an isolated environment where it can create files, run commands, install dependencies, inspect errors, and verify the result."
      />

      <Reveal delay={0.15} className="mt-14">
        <WindowChrome label="sandbox · workspace">
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_1fr]">
            {/* file explorer */}
            <div className="border-b border-border p-3 lg:min-h-105 lg:border-r lg:border-b-0">
              <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                <FolderTree className="size-3" />
                Explorer
              </div>
              <div className="space-y-1">
                {FILES.map((f) => (
                  <div
                    key={f.name}
                    className={`truncate rounded px-2 py-1 font-mono text-[11px] whitespace-pre ${
                      f.active
                        ? "bg-foreground/10 text-foreground/90"
                        : f.type === "dir"
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70"
                    }`}
                  >
                    {f.name}
                  </div>
                ))}
              </div>
            </div>

            {/* editor */}
            <div className="border-b border-border lg:min-h-105 lg:border-r lg:border-b-0">
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
                <FileCode2 className="size-3" />
                Navbar.tsx
              </div>
              <div className="space-y-1.5 p-3 font-mono text-[11px] leading-relaxed">
                <div>
                  {CODE_LINES.map((seg, i) => (
                    <span key={i} className={seg.c}>
                      {seg.t}
                    </span>
                  ))}
                </div>
                <div className="text-foreground/40">
                  <span className="text-purple-600 dark:text-purple-400">
                    export default
                  </span>{" "}
                  <span className="text-purple-600 dark:text-purple-400">
                    function
                  </span>{" "}
                  <span className="text-amber-600 dark:text-yellow-300">
                    Navbar
                  </span>
                  () {"{"}
                </div>
                <div className="pl-4 text-foreground/40">
                  <span className="text-purple-600 dark:text-purple-400">
                    return
                  </span>{" "}
                  (
                </div>
                <div className="pl-8 text-foreground/30">
                  &lt;nav className=
                  <span className="text-emerald-600 dark:text-emerald-400">
                    "flex items-center justify-between px-6 py-4"
                  </span>
                  &gt;
                </div>
                <div className="pl-12 text-foreground/30">
                  &lt;
                  <span className="text-red-600 dark:text-red-300">
                    Link
                  </span>{" "}
                  to=
                  <span className="text-emerald-600 dark:text-emerald-400">
                    "/"
                  </span>
                  &gt;Logo&lt;/
                  <span className="text-red-600 dark:text-red-300">Link</span>
                  &gt;
                </div>
                <div className="pl-12 text-foreground/30">
                  &lt;
                  <span className="text-red-600 dark:text-red-300">nav</span>
                  &gt;...&lt;/
                  <span className="text-red-600 dark:text-red-300">nav</span>
                  &gt;
                </div>
                <div className="pl-8 text-foreground/30">&lt;/nav&gt;</div>
                <div className="pl-4 text-foreground/40">);</div>
                <div className="text-foreground/40">{"}"}</div>
              </div>
            </div>

            {/* terminal + preview stack */}
            <div className="flex flex-col lg:min-h-105">
              <div className="flex-1 border-b border-border">
                <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
                  <TerminalSquare className="size-3" />
                  Terminal
                </div>
                <div
                  ref={containerRef}
                  className="space-y-1 p-3 font-mono text-[11px]"
                >
                  {TERMINAL_LINES.map((line, i) => (
                    <div key={i} ref={setLineRef(i)} className={line.tone}>
                      {line.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
                  <Globe className="size-3" />
                  Preview
                </div>
                <div className="p-3">
                  <div className="h-28 rounded-md border border-border bg-foreground/[0.03] p-2.5">
                    <div className="h-2 w-16 rounded bg-foreground/15" />
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <div className="h-8 rounded bg-foreground/[0.05]" />
                      <div className="h-8 rounded bg-foreground/[0.05]" />
                      <div className="h-8 rounded bg-foreground/[0.05]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* agent activity strip */}
          <div className="flex items-center gap-2 border-t border-border bg-foreground/[0.02] px-4 py-2.5 text-[11px] text-muted-foreground">
            <Bot className="size-3.5 text-foreground/60" />
            <span className="text-foreground/60">Agent</span>
            <span className="text-muted-foreground/60">·</span>
            <ScrollText className="size-3 text-muted-foreground/60" />
            <span>Editing Navbar.tsx, then re-running build…</span>
          </div>
        </WindowChrome>
      </Reveal>
    </Section>
  );
}
