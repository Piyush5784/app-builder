import { Download, Laptop, KeyRound, ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const ITEMS = [
  {
    icon: Download,
    title: "Export your code",
    description: "Download the full source of anything the agent builds.",
  },
  {
    icon: FaGithub,
    title: "Connect GitHub",
    description: "Push your project to a repository you own.",
  },
  {
    icon: Laptop,
    title: "Work locally",
    description: "Clone it and keep developing in your own editor.",
  },
  {
    icon: KeyRound,
    title: "Manage environment variables",
    description: "Configure secrets and config for your project.",
  },
];

export function GithubSection() {
  return (
    <Section>
      <SectionHeading
        kicker="Ownership"
        title="Your code. Your project. Your control."
        description="Nothing about what the agent builds is locked in. Take it wherever you need to."
      />

      <Reveal delay={0.15} className="mx-auto mt-14 max-w-3xl">
        <div className="flex items-center justify-center gap-4 rounded-2xl border border-border bg-foreground/[0.02] px-6 py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-foreground/[0.04] text-xs font-medium text-foreground/70">
              Agent
            </div>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground/60" />
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-foreground/[0.04]">
              <FaGithub className="size-5 text-foreground/70" />
            </div>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground/60" />
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-foreground/[0.04] text-xs font-medium text-foreground/70">
              Local
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.08}>
            <GlowCard className="h-full p-5">
              <item.icon className="size-5 text-foreground/70" />
              <h3 className="mt-4 text-sm font-medium text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
