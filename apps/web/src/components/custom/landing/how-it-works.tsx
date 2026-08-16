import { MessageSquareText, Hammer, RefreshCcw, Rocket } from "lucide-react";
import { Reveal, Section, SectionHeading } from "./shared";

const STEPS = [
  {
    n: "01",
    icon: MessageSquareText,
    title: "Describe",
    description: "Tell the agent what you want to build.",
  },
  {
    n: "02",
    icon: Hammer,
    title: "Build",
    description:
      "The agent creates and modifies the application inside a sandbox.",
  },
  {
    n: "03",
    icon: RefreshCcw,
    title: "Iterate",
    description:
      "It runs the app, reads errors, tests changes, and fixes problems.",
  },
  {
    n: "04",
    icon: Rocket,
    title: "Ship",
    description:
      "Preview, export, connect GitHub, and deploy your application.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        kicker="How it works"
        title="From idea to running app, in one loop."
      />

      <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pointer-events-none absolute top-8 right-0 left-0 hidden h-px bg-linear-to-r from-transparent via-border to-transparent lg:block" />

        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.1} className="relative">
            <div className="flex flex-col">
              <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
                <step.icon className="size-6 text-foreground/80" />
              </div>
              <span className="mt-5 font-mono text-xs text-muted-foreground/70">
                {step.n}
              </span>
              <h3 className="mt-1.5 text-lg font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
