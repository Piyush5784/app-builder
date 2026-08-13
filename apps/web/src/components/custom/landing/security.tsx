import { Box, ShieldCheck, Gauge, KeyRound, ArrowRight } from "lucide-react";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const POINTS = [
  { icon: Box, title: "Project isolation" },
  { icon: ShieldCheck, title: "Sandboxed execution" },
  { icon: Gauge, title: "Resource controls" },
  { icon: KeyRound, title: "Secure environment variables" },
];

export function Security() {
  return (
    <Section>
      <SectionHeading
        kicker="Security"
        title="Built around isolated execution."
        description="Every project runs in its own sandbox — not on shared infrastructure with your account."
      />

      <Reveal delay={0.15} className="mx-auto mt-14 max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-foreground/[0.02] px-6 py-8 text-center">
          {[
            "User Project",
            "Isolated Sandbox",
            "Resource Limits",
            "Controlled Execution",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-lg border border-border bg-foreground/[0.04] px-4 py-2.5 text-sm text-foreground/75">
                {step}
              </div>
              {i < arr.length - 1 ? (
                <ArrowRight className="size-4 text-muted-foreground/60" />
              ) : null}
            </div>
          ))}
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <GlowCard className="flex items-center gap-3 p-4">
              <p.icon className="size-4.5 shrink-0 text-foreground/60" />
              <span className="text-sm text-foreground/75">{p.title}</span>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
