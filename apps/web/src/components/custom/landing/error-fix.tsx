import { AlertTriangle, Bot } from "lucide-react";
import {
  CheckLine,
  Reveal,
  Section,
  SectionHeading,
  WindowChrome,
} from "./shared";

export function ErrorFixShowcase() {
  return (
    <Section>
      <SectionHeading
        title="Your agent doesn't stop when the first build fails."
        description="Errors are expected, not fatal. The agent reads the failure, finds the cause, and keeps going."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <WindowChrome
            label="build failed"
            icon={
              <AlertTriangle className="size-3 text-red-600 dark:text-red-400" />
            }
          >
            <div className="space-y-3 p-5 font-mono text-[13px]">
              <div className="text-muted-foreground">$ npm run build</div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-red-600 dark:text-red-400">
                Error: Cannot find module "@/components/Navbar"
              </div>
            </div>
          </WindowChrome>
        </Reveal>

        <Reveal delay={0.1}>
          <WindowChrome
            label="agent"
            icon={<Bot className="size-3 text-foreground/60" />}
          >
            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-border bg-foreground/[0.03] px-3.5 py-2.5 text-[13px] text-foreground/70">
                I found the issue. The component import path doesn't match the
                project structure.
              </div>
              <div className="space-y-2">
                <CheckLine delay={0.1}>Updated import</CheckLine>
                <CheckLine delay={0.25}>Rebuilt application</CheckLine>
                <CheckLine delay={0.4}>Build successful</CheckLine>
              </div>
            </div>
          </WindowChrome>
        </Reveal>
      </div>
    </Section>
  );
}
