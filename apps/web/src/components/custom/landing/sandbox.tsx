import * as React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Download, Eye, MessageSquareText, Wrench } from "lucide-react";
import { cn } from "@package/ui/lib/utils";
import { Container, H2, MaskHeading, Reveal, SectionHeader } from "./shared";

const SCREENSHOT =
  "https://res.cloudinary.com/dzf9kamfw/image/upload/v1788531819/Screenshot_from_2026-09-04_19-46-29_acx9xa.png";

const CALLOUTS = [
  {
    icon: MessageSquareText,
    title: "Chat with your agent",
    copy: "Ask for a change in plain words.",
    className: "left-[3%] top-[62%]",
  },
  {
    icon: Wrench,
    title: "Every step, visible",
    copy: "Files read, edits made, commands run.",
    className: "left-[16%] top-[6%]",
  },
  {
    icon: Eye,
    title: "Live preview",
    copy: "The real app, running in the sandbox.",
    className: "right-[4%] top-[44%]",
  },
  {
    icon: Download,
    title: "Code, download, share",
    copy: "Switch to code or take it with you.",
    className: "right-[6%] top-[3%]",
  },
];

export function SandboxSection() {
  const frame = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start end", "start 0.3"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section id="sandbox" className="scroll-mt-20 pb-24 sm:pb-32">
      <Container>
        <SectionHeader
          eyebrow="The workspace"
          copy="The agent doesn't just suggest code. It works inside an isolated environment where it creates files, runs commands, installs dependencies, inspects errors and verifies the result — while you watch."
          title={
            <MaskHeading
              lines={["A real dev environment", "for your AI agent."]}
              accentFrom={1}
              className={H2}
            />
          }
        />

        <div ref={frame} className="relative mt-14 [perspective:1800px]">
          <div
            className="absolute inset-x-[10%] top-10 bottom-0 rounded-[40px] bg-acid/10 blur-[100px]"
            aria-hidden="true"
          />
          <motion.div
            style={{ rotateX, y, transformOrigin: "50% 0%" }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-coal p-1.5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            <div className="overflow-hidden rounded-xl">
              {/* The capture includes the browser's toolbar; pull it out of view. */}
              <img
                src={SCREENSHOT}
                alt="The Wb workspace: the agent's chat and tool steps on the left, the live preview of the generated app on the right."
                loading="lazy"
                className="-mt-[2.7%] block w-full"
              />
            </div>
          </motion.div>

          {CALLOUTS.map((c, i) => (
            <Reveal
              key={c.title}
              delay={0.3 + i * 0.12}
              className={cn("absolute hidden lg:block", c.className)}
            >
              <div className="flex max-w-[230px] items-start gap-3 rounded-xl border border-white/10 bg-void/85 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-acid text-void">
                  <c.icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-white">
                    {c.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-mute">
                    {c.copy}
                  </span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:hidden">
          {CALLOUTS.map((c) => (
            <li
              key={c.title}
              className="kestrel-card flex items-start gap-3 p-4"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-acid text-void">
                <c.icon className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[14px] font-medium text-white">
                  {c.title}
                </span>
                <span className="mt-0.5 block text-[13px] text-mute">
                  {c.copy}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
