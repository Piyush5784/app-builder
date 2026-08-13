import {
  ListChecks,
  Code2,
  TerminalSquare,
  Bug,
  FlaskConical,
  Globe,
  Package,
  RefreshCcw,
} from "lucide-react";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const CAPABILITIES = [
  {
    icon: ListChecks,
    title: "Planning",
    description:
      "The agent breaks complex requirements into implementation steps.",
  },
  {
    icon: Code2,
    title: "Coding",
    description: "Creates and modifies your application code.",
  },
  {
    icon: TerminalSquare,
    title: "Terminal",
    description: "Runs commands and development tools.",
  },
  {
    icon: Bug,
    title: "Debugging",
    description: "Reads errors and fixes problems.",
  },
  {
    icon: FlaskConical,
    title: "Testing",
    description: "Runs builds and tests to verify changes.",
  },
  {
    icon: Globe,
    title: "Browser",
    description: "Checks the running application through a real preview.",
  },
  {
    icon: Package,
    title: "Package management",
    description: "Installs and configures dependencies.",
  },
  {
    icon: RefreshCcw,
    title: "Iteration",
    description:
      "Continues improving the application until the requested result works.",
  },
];

export function Capabilities() {
  return (
    <Section id="capabilities">
      <SectionHeading
        kicker="Agent capabilities"
        title="Everything a software engineer does — automated."
        description="Not a single-shot code generator. A loop that plans, builds, and verifies."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((cap, i) => (
          <Reveal key={cap.title} delay={(i % 4) * 0.06}>
            <GlowCard className="h-full p-5">
              <cap.icon className="size-5 text-foreground/70" />
              <h3 className="mt-4 text-sm font-medium text-foreground">
                {cap.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {cap.description}
              </p>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
