import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@package/ui/lib/utils";
import {
  Container,
  EASE,
  H2,
  MaskHeading,
  Reveal,
  SectionHeader,
} from "./shared";

const FAQS = [
  {
    q: "What can I build?",
    a: "Web applications — dashboards, SaaS products, internal tools, landing pages and more, described in natural language and built by the agent inside a sandbox.",
  },
  {
    q: "Does the AI write the actual code?",
    a: "Yes. The agent plans, writes and modifies real source files in your project — it isn't producing a static mockup.",
  },
  {
    q: "Where does my code run?",
    a: "Inside an isolated sandbox environment created for your project, separate from other users' projects.",
  },
  {
    q: "Can I edit the generated code?",
    a: "Yes. You can review and modify anything the agent produces, in the sandbox or after exporting it.",
  },
  {
    q: "Can I connect GitHub?",
    a: "Yes. You can connect a repository and push your project to GitHub.",
  },
  {
    q: "Can I use my own API keys?",
    a: "Yes. Environment variables and secrets can be configured per project.",
  },
  {
    q: "Can I deploy my application?",
    a: "Yes. Projects can be built and deployed, with preview deployments and custom domains available on paid plans.",
  },
  {
    q: "What happens when the AI encounters an error?",
    a: "The agent reads the error output, inspects the relevant files, applies a fix and re-runs the build or tests to verify it.",
  },
  {
    q: "How are AI credits calculated?",
    a: "Credits are consumed based on agent actions — planning, code generation and sandbox operations like installs and builds.",
  },
  {
    q: "Is my sandbox isolated?",
    a: "Yes. Each project runs in its own isolated sandbox with resource limits, separate from other projects and users.",
  },
];

export function Faq() {
  const [open, setOpen] = React.useState(0);
  const baseId = React.useId();

  return (
    <section id="faq" className="scroll-mt-20 pb-24 sm:pb-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            copy="Everything you need to know before your first build."
            title={
              <MaskHeading
                lines={["Questions,", "answered."]}
                accentFrom={1}
                className={H2}
              />
            }
          />
        </div>
        <Reveal delay={0.1}>
          <ul className="border-t border-white/[0.08]">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              const panelId = `${baseId}-${i}`;
              return (
                <li key={item.q} className="border-b border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-4 py-5 text-left"
                  >
                    <span
                      className={cn(
                        "flex-1 text-[16px] font-medium transition-colors sm:text-[17px]",
                        isOpen ? "text-white" : "text-white/75",
                      )}
                    >
                      {item.q}
                    </span>
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-500",
                        isOpen
                          ? "rotate-45 border-acid/40 bg-acid text-void"
                          : "border-white/15 text-white/70",
                      )}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[62ch] pr-12 pb-6 text-[15px] leading-relaxed text-mute">
                          {item.a}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
