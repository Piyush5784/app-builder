import { GitFork, ArrowUpRight } from "lucide-react";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const PROJECTS = [
  {
    name: "Pulse Analytics",
    description: "Realtime product analytics dashboard with cohort views.",
    tags: ["Next.js", "PostgreSQL"],
    tint: "from-sky-400/15",
  },
  {
    name: "Nimbus CRM",
    description: "Lightweight CRM for small sales teams.",
    tags: ["React", "Node.js"],
    tint: "from-emerald-400/15",
  },
  {
    name: "Kanbanly",
    description: "Drag-and-drop project and task tracker.",
    tags: ["Vite", "Tailwind"],
    tint: "from-violet-400/15",
  },
  {
    name: "Storefront",
    description: "Headless e-commerce storefront with cart and checkout.",
    tags: ["Next.js", "Tailwind"],
    tint: "from-amber-400/15",
  },
  {
    name: "Askly",
    description: "Support chatbot with a knowledge-base backend.",
    tags: ["React", "PostgreSQL"],
    tint: "from-rose-400/15",
  },
  {
    name: "Ledgerly",
    description: "Personal finance tracker with monthly reports.",
    tags: ["Vite", "Node.js"],
    tint: "from-cyan-400/15",
  },
];

export function Gallery() {
  return (
    <Section>
      <SectionHeading
        kicker="Community"
        title="See what people are building."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.name} delay={(i % 3) * 0.08}>
            <GlowCard className="p-0">
              <div
                className={`h-32 bg-linear-to-br ${p.tint} to-transparent`}
              />
              <div className="p-5">
                <h3 className="text-sm font-medium text-foreground">
                  {p.name}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-border pt-3.5">
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground">
                    View project
                    <ArrowUpRight className="size-3.5" />
                  </button>
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground/70">
                    <GitFork className="size-3.5" />
                    Remix
                  </button>
                </div>
              </div>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
