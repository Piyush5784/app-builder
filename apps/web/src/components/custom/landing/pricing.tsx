import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { cn } from "@package/ui/lib/utils";
import {
  Container,
  H2,
  MaskHeading,
  Reveal,
  SectionHeader,
  Spotlight,
} from "./shared";

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
    <section id="pricing" className="scroll-mt-20 pb-24 sm:pb-32">
      <Container>
        <SectionHeader
          eyebrow="Pricing"
          copy="AI credits, sandbox usage and deployments — included at every tier."
          title={
            <MaskHeading
              lines={["Simple pricing that", "scales with you."]}
              accentFrom={1}
              className={H2}
            />
          }
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1} className="h-full">
              <Spotlight
                className={cn(
                  "flex h-full flex-col p-7",
                  plan.featured &&
                    "border-acid/35 bg-[linear-gradient(180deg,rgba(200,255,61,0.08),rgba(255,255,255,0.01))] shadow-[0_0_80px_-30px_rgba(200,255,61,0.5)]",
                )}
              >
                <div className="relative flex items-center justify-between">
                  <h3 className="text-[18px] font-medium text-white">
                    {plan.name}
                  </h3>
                  {plan.featured ? (
                    <span className="rounded-full bg-acid px-2.5 py-0.5 font-code text-[11px] font-medium text-void">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="relative mt-1 text-[14px] text-mute">
                  {plan.description}
                </p>
                <div className="relative mt-7 flex items-baseline gap-1">
                  <span className="text-[48px] leading-none font-medium tracking-[-0.05em] text-white">
                    {plan.price}
                  </span>
                  <span className="text-[14px] text-dim">{plan.period}</span>
                </div>

                <ul className="relative mt-7 flex-1 space-y-3 border-t border-white/[0.07] pt-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[14px] text-white/75"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                          plan.featured
                            ? "bg-acid text-void"
                            : "bg-white/10 text-white/80",
                        )}
                      >
                        <Check
                          className="size-2.5"
                          strokeWidth={3.5}
                          aria-hidden="true"
                        />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/dashboard"
                  className={cn(
                    "relative mt-8 inline-flex h-11 items-center justify-center rounded-full px-4 text-[14px] font-medium transition-colors",
                    plan.featured
                      ? "bg-acid text-void hover:bg-[#d6ff6b]"
                      : "border border-white/15 bg-white/[0.03] text-white hover:border-white/30 hover:bg-white/[0.06]",
                  )}
                >
                  {plan.cta}
                </Link>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
