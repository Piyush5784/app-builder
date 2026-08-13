import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { cn } from "@package/ui/lib/utils";
import { GlowCard, Reveal, Section, SectionHeading } from "./shared";

const PLANS = [
  {
    name: "Free",
    description: "For experimenting and learning",
    price: "$0",
    period: "",
    cta: "Start building",
    featured: false,
    features: [
      "5 AI credits / month",
      "1 active sandbox",
      "3 projects",
      "Community templates",
      "Preview deployments",
    ],
  },
  {
    name: "Pro",
    description: "For serious builders",
    price: "$29",
    period: "/month",
    cta: "Start building",
    featured: true,
    features: [
      "200 AI credits / month",
      "3 concurrent sandboxes",
      "Unlimited projects",
      "GitHub integration",
      "Custom domains",
      "Priority sandbox performance",
    ],
  },
  {
    name: "Team",
    description: "For teams building together",
    price: "$79",
    period: "/month",
    cta: "Contact sales",
    featured: false,
    features: [
      "800 shared AI credits / month",
      "10 concurrent sandboxes",
      "Shared projects & workspaces",
      "Role-based access",
      "GitHub integration",
      "Custom domains",
    ],
  },
];

export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        kicker="Pricing"
        title="Simple pricing that scales with you."
        description="AI credits, sandbox usage, and deployments — all included at every tier."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.1}>
            <GlowCard
              className={cn(
                "flex h-full flex-col p-6",
                plan.featured &&
                  "border-foreground/25 bg-foreground/[0.04] shadow-[0_0_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_-15px_rgba(255,255,255,0.15)]",
              )}
            >
              {plan.featured ? (
                <span className="mb-4 w-fit rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-lg font-medium text-foreground">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground/65"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/dashboard"
                className={cn(
                  "mt-8 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]",
                  plan.featured
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground/85 hover:bg-foreground/5",
                )}
              >
                {plan.cta}
              </Link>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
