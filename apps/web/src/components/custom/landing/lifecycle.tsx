import { Reveal, Section, SectionHeading } from "./shared";

const STAGES = [
  "Idea",
  "Prompt",
  "Plan",
  "Code",
  "Sandbox",
  "Test",
  "Debug",
  "Preview",
  "Deploy",
];

export function Lifecycle() {
  return (
    <Section>
      <SectionHeading
        kicker="The full lifecycle"
        title="From idea to production."
        description="A complete software development lifecycle, run by the agent."
      />

      <Reveal delay={0.15} className="mt-14 overflow-x-auto">
        <div className="mx-auto flex w-fit min-w-full items-center justify-center gap-2 px-2 sm:gap-3">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 items-center rounded-full border border-border bg-foreground/[0.03] px-4 text-xs font-medium whitespace-nowrap text-foreground/75">
                  {stage}
                </div>
              </div>
              {i < STAGES.length - 1 ? (
                <div className="h-px w-4 bg-border sm:w-6" />
              ) : null}
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
