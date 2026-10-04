import * as React from "react";
import { motion, useInView } from "motion/react";
import {
  Bot,
  Bug,
  Code2,
  FlaskConical,
  Globe,
  ListChecks,
  Lock,
  Package,
  RefreshCcw,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { Scramble } from "./effects";
import {
  Container,
  EASE,
  H2,
  MaskHeading,
  Reveal,
  SectionHeader,
  Spotlight,
} from "./shared";

const CAPABILITIES = [
  {
    icon: ListChecks,
    title: "Planning",
    description: "Breaks complex requirements into implementation steps.",
  },
  {
    icon: Code2,
    title: "Coding",
    description: "Creates and modifies your application code.",
  },
  {
    icon: TerminalSquare,
    title: "Terminal",
    description: "Runs commands and development tools.",
  },
  {
    icon: Bug,
    title: "Debugging",
    description: "Reads errors and fixes problems.",
  },
  {
    icon: FlaskConical,
    title: "Testing",
    description: "Runs builds and tests to verify changes.",
  },
  {
    icon: Globe,
    title: "Browser",
    description: "Checks the running app through a real preview.",
  },
  {
    icon: Package,
    title: "Packages",
    description: "Installs and configures dependencies.",
  },
  {
    icon: RefreshCcw,
    title: "Iteration",
    description: "Keeps improving until the requested result works.",
  },
];

function Tag({ icon: Icon, children }: { icon: typeof Bot; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-code text-[11px] tracking-[0.14em] text-mute uppercase">
      <Icon className="size-[13px] text-acid" aria-hidden="true" />
      {children}
    </span>
  );
}

function CardText({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="relative">
      <h3 className="text-[19px] font-medium tracking-[-0.02em] text-white">
        {title}
      </h3>
      <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-mute">
        {copy}
      </p>
    </div>
  );
}

const px = (n: number) => `${n.toFixed(2)}px`;

/** The agent's skills orbiting it. Badges counter-rotate to stay upright. */
function Orbit() {
  const skills = [
    "Plan",
    "Code",
    "Run",
    "Debug",
    "Test",
    "Install",
    "Preview",
    "Ship",
  ];
  const rings = [
    {
      size: 190,
      items: skills.slice(0, 3),
      cls: "animate-spin-slow",
      counter: "animate-spin-slow [animation-direction:reverse]",
    },
    {
      size: 320,
      items: skills.slice(3),
      cls: "animate-spin-slower",
      counter: "animate-[spin_40s_linear_infinite]",
    },
  ];
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[460px] [mask-image:radial-gradient(circle,black_55%,transparent_75%)]">
      {rings.map((ring) => (
        <div
          key={ring.size}
          className={`absolute top-1/2 left-1/2 rounded-full border border-dashed border-white/10 ${ring.cls}`}
          style={{
            width: ring.size,
            height: ring.size,
            marginLeft: -ring.size / 2,
            marginTop: -ring.size / 2,
          }}
        >
          {ring.items.map((skill, i) => {
            const angle = (i / ring.items.length) * Math.PI * 2;
            const r = ring.size / 2;
            return (
              <span
                key={skill}
                className="absolute grid h-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border border-white/10 bg-graphite px-2.5 font-code text-[11px] text-white/80 shadow-lg"
                style={{
                  left: px(r + Math.cos(angle) * r),
                  top: px(r + Math.sin(angle) * r),
                }}
              >
                <span className={`block ${ring.counter}`}>{skill}</span>
              </span>
            );
          })}
        </div>
      ))}
      <div className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-acid/40 bg-acid/10 text-acid shadow-[0_0_60px_-6px_rgba(200,255,61,0.6)]">
        <Bot className="size-7" aria-hidden="true" />
      </div>
    </div>
  );
}

/** A ring that fills as the agent's checks pass. */
function Verify() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const R = 62;
  const C = 2 * Math.PI * R;
  const checks = ["Build", "Types", "Preview", "Tests"];
  return (
    <div ref={ref} className="flex flex-col items-center gap-5">
      <div className="relative size-[150px]">
        <svg
          viewBox="0 0 150 150"
          className="size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="75"
            cy="75"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <motion.circle
            cx="75"
            cy="75"
            r={R}
            fill="none"
            stroke="url(#wb-verify)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={inView ? { strokeDasharray: `${C} ${C}` } : undefined}
            transition={{ duration: 1.8, ease: EASE }}
          />
          <defs>
            <linearGradient id="wb-verify" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#5EEAD4" />
              <stop offset="1" stopColor="#C8FF3D" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ShieldCheck className="size-8 text-acid" aria-hidden="true" />
          <span className="mt-1 font-code text-[10px] tracking-[0.16em] text-dim uppercase">
            verified
          </span>
        </div>
      </div>
      <ul className="flex flex-wrap justify-center gap-2">
        {checks.map((c, i) => (
          <motion.li
            key={c}
            initial={{ opacity: 0.3 }}
            animate={inView ? { opacity: 1 } : undefined}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.25 }}
            className="flex items-center gap-1.5 rounded-full border border-acid/25 bg-acid/[0.06] px-2.5 py-1 font-code text-[11px] text-acid"
          >
            ✓ {c}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const TERMINAL = [
  { text: "$ npm install", tone: "text-white" },
  { text: "added 214 packages in 6s", tone: "text-dim" },
  { text: "$ npm run dev", tone: "text-white" },
  { text: "VITE ready in 412 ms", tone: "text-dim" },
  { text: "➜ Local: http://localhost:5173/", tone: "text-acid" },
];

function MiniTerminal() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-void/70"
    >
      <p className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2 font-code text-[11px] text-dim">
        <TerminalSquare className="size-3.5 text-acid" aria-hidden="true" />
        sandbox · ~/app
      </p>
      <pre className="p-3 font-code text-[12px] leading-[1.8]">
        {TERMINAL.map((line, i) => (
          <motion.div
            key={line.text}
            initial={{ opacity: 0, x: -6 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.35, ease: EASE, delay: 0.2 + i * 0.35 }}
            className={line.tone}
          >
            {line.text}
          </motion.div>
        ))}
      </pre>
    </div>
  );
}

export function Capabilities() {
  return (
    <section id="capabilities" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Agent capabilities"
          copy="Not a single-shot code generator. A loop that plans, builds and verifies — like a software engineer would."
          title={
            <MaskHeading
              lines={["Everything an engineer does,", "automated."]}
              accentFrom={1}
              className={H2}
            />
          }
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <Spotlight className="flex h-full flex-col gap-6 p-6 sm:p-8">
              <Tag icon={Workflow}>The full loop</Tag>
              <Orbit />
              <CardText
                title="One agent, the whole workflow"
                copy="It plans the work, writes the code, runs it, reads the errors and fixes them — then checks the result in a real preview."
              />
            </Spotlight>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-2">
            <Spotlight className="flex h-full flex-col gap-6 p-6 sm:p-8">
              <Tag icon={ShieldCheck}>Verified</Tag>
              <div className="flex flex-1 items-center justify-center">
                <Verify />
              </div>
              <CardText
                title="It checks its own work"
                copy="Every change is built, type-checked and previewed before the agent calls it done."
              />
            </Spotlight>
          </Reveal>
          <Reveal className="lg:col-span-2">
            <Spotlight className="flex h-full flex-col gap-6 p-6 sm:p-8">
              <Tag icon={Lock}>Isolated</Tag>
              <div className="relative flex flex-1 flex-col items-center justify-center gap-5 py-4">
                <div className="relative grid size-24 place-items-center">
                  <span
                    className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-acid/30"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute inset-3 rounded-full border border-white/10"
                    aria-hidden="true"
                  />
                  <span className="grid size-12 place-items-center rounded-full bg-acid/10 text-acid shadow-[0_0_40px_-4px_rgba(200,255,61,0.5)]">
                    <Lock className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <code className="max-w-full truncate rounded-lg border border-white/[0.07] bg-void/60 px-3 py-2 font-code text-[12px] text-white/70">
                  DATABASE_URL = &quot;
                  <Scramble
                    text="postgres://app@db/prod"
                    className="text-acid"
                  />
                  &quot;
                </code>
                <ul className="flex flex-wrap justify-center gap-2">
                  {[
                    "Own sandbox",
                    "Per-project secrets",
                    "Resource limits",
                  ].map((b) => (
                    <li
                      key={b}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-code text-[11px] text-mute"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <CardText
                title="A sandbox for every project"
                copy="Each project runs in its own isolated environment, with its own secrets — separate from everyone else's."
              />
            </Spotlight>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-3">
            <Spotlight className="flex h-full flex-col gap-6 p-6 sm:p-8">
              <Tag icon={TerminalSquare}>Real terminal</Tag>
              <div className="flex flex-1 items-center">
                <div className="w-full">
                  <MiniTerminal />
                </div>
              </div>
              <CardText
                title="Runs real commands, not a simulation"
                copy="The agent installs packages, starts dev servers and runs builds in a real terminal — exactly what you'd do yourself."
              />
            </Spotlight>
          </Reveal>
        </div>

        <ul className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap, i) => (
            <li key={cap.title} className="bg-void">
              <Reveal delay={(i % 4) * 0.06} className="h-full p-5">
                <cap.icon className="size-5 text-acid" aria-hidden="true" />
                <h3 className="mt-4 text-[15px] font-medium text-white">
                  {cap.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
                  {cap.description}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
