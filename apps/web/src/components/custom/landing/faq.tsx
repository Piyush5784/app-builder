import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@package/ui/components/accordion";
import { Reveal, Section, SectionHeading } from "./shared";

const FAQS = [
  {
    q: "What can I build?",
    a: "Web applications — dashboards, SaaS products, internal tools, landing pages, and more, described in natural language and built by the agent inside a sandbox.",
  },
  {
    q: "Does the AI write the actual code?",
    a: "Yes. The agent plans, writes, and modifies real source files in your project — it isn't producing a static mockup.",
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
    a: "The agent reads the error output, inspects the relevant files, applies a fix, and re-runs the build or tests to verify it.",
  },
  {
    q: "How are AI credits calculated?",
    a: "Credits are consumed based on agent actions — planning, code generation, and sandbox operations like installs and builds.",
  },
  {
    q: "Is my sandbox isolated?",
    a: "Yes. Each project runs in its own isolated sandbox with resource limits, separate from other projects and users.",
  },
];

export function Faq() {
  return (
    <Section>
      <SectionHeading kicker="FAQ" title="Questions, answered." />

      <Reveal delay={0.15} className="mx-auto mt-14 max-w-2xl">
        <Accordion
          multiple
          className="**:data-[slot=accordion-item]:border-border"
        >
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-foreground/90">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  );
}
