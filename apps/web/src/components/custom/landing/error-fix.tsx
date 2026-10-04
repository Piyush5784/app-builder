import * as React from "react";
import { motion, useInView } from "motion/react";
import { AlertTriangle, ArrowRight, Bot, Check } from "lucide-react";
import { highlight } from "./code";
import {
  Container,
  EASE,
  H2,
  MaskHeading,
  Reveal,
  SectionHeader,
} from "./shared";

const BEFORE = [
  'import Navbar from "@/components/Navbar";',
  'import { Hero } from "@/sections/hero";',
];
const AFTER = [
  'import { Navbar } from "@/components/layout/Navbar";',
  'import { Hero } from "@/sections/hero";',
];
const FIXES = [
  "Updated the import path",
  "Rebuilt the application",
  "Build successful",
];

export function ErrorFixShowcase() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <div className="kestrel-card overflow-hidden p-6 sm:p-10 lg:p-14">
          <div
            className="pointer-events-none absolute -top-40 -right-40 size-[420px] rounded-full bg-del/[0.06] blur-[100px]"
            aria-hidden="true"
          />
          <SectionHeader
            align="left"
            eyebrow="Self-healing"
            copy="Errors are expected, not fatal. The agent reads the failure, finds the cause, fixes it and keeps going."
            title={
              <MaskHeading
                lines={["It doesn't stop when", "the first build fails."]}
                accentFrom={1}
                className={H2}
              />
            }
          />

          <div
            ref={ref}
            className="relative mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]"
          >
            <Reveal className="h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-del/20 bg-void/70">
                <p className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5 font-code text-[12px] text-mute">
                  <AlertTriangle
                    className="size-3.5 text-del"
                    aria-hidden="true"
                  />
                  build failed
                </p>
                <div className="space-y-3 p-4 font-code text-[12.5px]">
                  <p className="text-white">
                    <span className="text-acid">$ </span>npm run build
                  </p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : undefined}
                    transition={{ delay: 0.4 }}
                    className="rounded-lg border border-del/25 bg-del/[0.08] p-3 text-[#ffaaaa]"
                  >
                    Error: Cannot find module &quot;@/components/Navbar&quot;
                  </motion.p>
                  <pre className="leading-[1.8]">
                    {BEFORE.map((l, i) => (
                      <div
                        key={l}
                        className={
                          i === 0
                            ? "rounded-sm bg-del/10 px-1 whitespace-pre text-[#ffaaaa]/80"
                            : "px-1 whitespace-pre text-white/50"
                        }
                      >
                        <span className="mr-2 text-del/70">
                          {i === 0 ? "−" : " "}
                        </span>
                        {l}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </Reveal>

            <span
              className="mx-auto grid size-10 rotate-90 place-items-center self-center rounded-full border border-acid/30 bg-acid/10 text-acid lg:rotate-0"
              aria-hidden="true"
            >
              <ArrowRight className="size-4" />
            </span>

            <Reveal delay={0.15} className="h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-acid/20 bg-void/70">
                <p className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5 font-code text-[12px] text-mute">
                  <span className="flex items-center gap-2">
                    <Bot className="size-3.5 text-acid" aria-hidden="true" />
                    agent
                  </span>
                  <span className="text-acid">+1 −1</span>
                </p>
                <div className="space-y-4 p-4">
                  <p className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/75">
                    Found it — the import path doesn&apos;t match the project
                    structure. Fixing and rebuilding.
                  </p>
                  <pre className="font-code text-[12px] leading-[1.8]">
                    {AFTER.map((l, i) => (
                      <motion.div
                        key={l}
                        initial={{ opacity: 0, x: -8 }}
                        animate={inView ? { opacity: 1, x: 0 } : undefined}
                        transition={{
                          duration: 0.45,
                          ease: EASE,
                          delay: 0.7 + i * 0.1,
                        }}
                        className={
                          i === 0
                            ? "rounded-sm bg-acid/[0.08] px-1 whitespace-pre text-white/85"
                            : "px-1 whitespace-pre text-white/50"
                        }
                      >
                        <span className="mr-2 text-acid">
                          {i === 0 ? "+" : " "}
                        </span>
                        {highlight(l)}
                      </motion.div>
                    ))}
                  </pre>
                  <ul className="space-y-2">
                    {FIXES.map((f, i) => (
                      <motion.li
                        key={f}
                        initial={{ opacity: 0, x: -8 }}
                        animate={inView ? { opacity: 1, x: 0 } : undefined}
                        transition={{
                          duration: 0.35,
                          ease: EASE,
                          delay: 1.1 + i * 0.25,
                        }}
                        className="flex items-center gap-2.5 font-code text-[12.5px] text-white/85"
                      >
                        <span className="grid size-4 place-items-center rounded-full bg-acid text-void">
                          <Check
                            className="size-2.5"
                            strokeWidth={3.5}
                            aria-hidden="true"
                          />
                        </span>
                        {f}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
