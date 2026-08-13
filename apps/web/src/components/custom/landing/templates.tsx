import {
  LayoutDashboard,
  MessageCircle,
  Users,
  ShoppingCart,
  KanbanSquare,
  BarChart3,
  UserCircle,
  ShieldHalf,
  ArrowUpRight,
} from "lucide-react";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const TEMPLATES = [
  { icon: LayoutDashboard, name: "SaaS Dashboard", tint: "from-sky-400/20" },
  { icon: MessageCircle, name: "AI Chatbot", tint: "from-violet-400/20" },
  { icon: Users, name: "CRM", tint: "from-amber-400/20" },
  { icon: ShoppingCart, name: "E-commerce", tint: "from-emerald-400/20" },
  { icon: KanbanSquare, name: "Project Management", tint: "from-rose-400/20" },
  { icon: BarChart3, name: "Analytics Dashboard", tint: "from-cyan-400/20" },
  { icon: UserCircle, name: "Portfolio", tint: "from-fuchsia-400/20" },
  { icon: ShieldHalf, name: "Admin Panel", tint: "from-orange-400/20" },
];

export function Templates() {
  return (
    <Section id="templates">
      <SectionHeading kicker="Templates" title="Start with an idea." />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t, i) => (
          <Reveal key={t.name} delay={(i % 4) * 0.06}>
            <GlowCard className="cursor-pointer p-0">
              <div
                className={`relative h-28 bg-linear-to-br ${t.tint} to-transparent`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <t.icon className="size-8 text-foreground/50" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-foreground/85">
                  {t.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  Build this
                  <ArrowUpRight className="size-3.5" />
                </span>
              </div>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
