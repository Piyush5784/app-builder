import {
  Eye,
  Globe2,
  Lock,
  KeyRound,
  ScrollText,
  RotateCcw,
} from "lucide-react";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const FEATURES = [
  { icon: Eye, title: "Preview deployments" },
  { icon: Globe2, title: "Custom domains" },
  { icon: Lock, title: "HTTPS" },
  { icon: KeyRound, title: "Environment variables" },
  { icon: ScrollText, title: "Logs" },
  { icon: RotateCcw, title: "Rollbacks" },
];

export function Deployment() {
  return (
    <Section>
      <SectionHeading kicker="Deployment" title="From prompt to production." />

      <Reveal delay={0.15} className="mx-auto mt-14 max-w-md">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-foreground/[0.02] px-8 py-8 text-center">
          <div className="rounded-lg border border-border bg-foreground/[0.04] px-4 py-2 text-sm text-foreground/70">
            Your App
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="rounded-lg border border-border bg-foreground/[0.04] px-4 py-2 text-sm text-foreground/70">
            Build
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="rounded-lg border border-border bg-foreground/[0.04] px-4 py-2 text-sm text-foreground/70">
            Deploy
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2 font-mono text-sm text-emerald-600 dark:text-emerald-400">
            https://your-app.example.com
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <GlowCard className="flex items-center gap-3 p-4">
              <f.icon className="size-4.5 shrink-0 text-foreground/60" />
              <span className="text-sm text-foreground/75">{f.title}</span>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
