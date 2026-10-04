import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  Download,
  Eye,
  FolderArchive,
  KeyRound,
  Laptop,
  Share2,
  Terminal,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { LogoMark } from "./brand";
import {
  Container,
  EASE,
  H2,
  MaskHeading,
  Reveal,
  SectionHeader,
} from "./shared";

const ITEMS = [
  {
    icon: Download,
    title: "Export your code",
    description: "Download the full source of anything the agent builds.",
  },
  {
    icon: FaGithub,
    title: "Connect GitHub",
    description: "Push your project to a repository you own.",
  },
  {
    icon: Laptop,
    title: "Work locally",
    description: "Clone it and keep developing in your own editor.",
  },
  {
    icon: KeyRound,
    title: "Environment variables",
    description: "Configure secrets and config for your project.",
  },
];

const TOOLS = [
  { label: "GitHub", icon: FaGithub },
  { label: "ZIP export", icon: FolderArchive },
  { label: "Local dev", icon: Laptop },
  { label: ".env", icon: KeyRound },
  { label: "Preview", icon: Eye },
  { label: "Share", icon: Share2 },
];

const TERMINAL = [
  { kind: "cmd", text: "git clone github.com/you/coffee-box" },
  { kind: "dim", text: "Cloning into 'coffee-box'… done." },
  { kind: "cmd", text: "cd coffee-box && npm install" },
  { kind: "dim", text: "added 214 packages in 6s" },
  { kind: "cmd", text: "npm run dev" },
  { kind: "ok", text: "VITE ready in 412 ms" },
  { kind: "acid", text: "➜  Local: http://localhost:5173/" },
] as const;

// Round trig output so the attribute strings are stable.
const round = (n: number) => n.toFixed(2);

/** Where your code can go, wired to the logo with travelling dashes. */
function Hub() {
  const R = 132;
  const C = 190;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px]">
      <svg
        viewBox="0 0 380 380"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
        />
        <circle
          cx={C}
          cy={C}
          r={R * 0.55}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="2 6"
        />
        {TOOLS.map((_, i) => {
          const a = (i / TOOLS.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={C}
              y1={C}
              x2={round(C + Math.cos(a) * R)}
              y2={round(C + Math.sin(a) * R)}
              stroke={
                i % 2 === 0 ? "rgba(200,255,61,0.55)" : "rgba(255,255,255,0.12)"
              }
              strokeDasharray="3 5"
              className="animate-dash"
              style={{ animationDuration: `${1 + (i % 3) * 0.4}s` }}
            />
          );
        })}
      </svg>
      {TOOLS.map((tool, i) => {
        const a = (i / TOOLS.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <div
            key={tool.label}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{
              left: `${round(((C + Math.cos(a) * R) / 380) * 100)}%`,
              top: `${round(((C + Math.sin(a) * R) / 380) * 100)}%`,
            }}
          >
            <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-graphite text-white/85 shadow-lg">
              <tool.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-[11px] whitespace-nowrap text-dim">
              {tool.label}
            </span>
          </div>
        );
      })}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          className="absolute inset-0 -m-4 animate-ping rounded-3xl bg-acid/10 [animation-duration:2.4s]"
          aria-hidden="true"
        />
        <span className="relative grid size-20 place-items-center rounded-3xl border border-acid/40 bg-coal shadow-[0_0_80px_-10px_rgba(200,255,61,0.55)]">
          <LogoMark className="size-10" />
        </span>
      </div>
    </div>
  );
}

function Console() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(0);
  const [typed, setTyped] = React.useState(0);

  React.useEffect(() => {
    if (!inView || reduced || shown >= TERMINAL.length) return;
    const line = TERMINAL[shown];
    // Commands are typed out; output lines appear at once.
    if (line.kind === "cmd" && typed < line.text.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setShown((n) => n + 1);
        setTyped(0);
      },
      line.kind === "cmd" ? 380 : 260,
    );
    return () => clearTimeout(t);
  }, [inView, reduced, shown, typed]);

  const visible = reduced ? TERMINAL.length : shown;
  const tone = {
    cmd: "text-white",
    dim: "text-dim",
    ok: "text-teal",
    acid: "text-acid",
  } as const;

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-white/10 bg-coal shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
        <Terminal className="size-3.5 text-acid" aria-hidden="true" />
        <span className="font-code text-[12px] text-mute">~/code — zsh</span>
      </div>
      <pre
        className="min-h-[280px] overflow-x-auto p-5 font-code text-[12.5px] leading-[1.9]"
        aria-label="Cloning a generated project and running it locally"
      >
        {TERMINAL.map((line, i) => {
          if (i > visible) return null;
          const current = i === visible;
          if (current && line.kind !== "cmd") return null;
          const text = current ? line.text.slice(0, typed) : line.text;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={`whitespace-pre ${tone[line.kind]}`}
            >
              {line.kind === "cmd" ? (
                <span className="text-acid">$ </span>
              ) : null}
              {text}
              {current ? (
                <span
                  className="ml-px inline-block h-[1em] w-[7px] translate-y-[2px] animate-blink bg-acid/80"
                  aria-hidden="true"
                />
              ) : null}
            </motion.div>
          );
        })}
        {visible >= TERMINAL.length ? (
          <div className="text-white">
            <span className="text-acid">$ </span>
            <span
              className="inline-block h-[1em] w-[7px] translate-y-[2px] animate-blink bg-acid/80"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </pre>
    </div>
  );
}

export function GithubSection() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <div className="kestrel-card grid gap-12 overflow-hidden p-6 sm:p-10 lg:grid-cols-2 lg:gap-10 lg:p-14">
          <div
            className="pointer-events-none absolute -top-40 -left-40 size-[420px] rounded-full bg-acid/[0.06] blur-[100px]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col">
            <SectionHeader
              align="left"
              eyebrow="Ownership"
              copy="Nothing the agent builds is locked in. Take it wherever you need it."
              title={
                <MaskHeading
                  lines={["Your code. Your project.", "Your control."]}
                  accentFrom={1}
                  className={H2}
                />
              }
            />
            <div className="mt-10 flex-1">
              <Hub />
            </div>
          </div>
          <div className="relative flex flex-col justify-center gap-6">
            <Reveal delay={0.15}>
              <Console />
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {ITEMS.map((item, i) => (
                <Reveal key={item.title} delay={0.2 + i * 0.06}>
                  <div className="flex h-full items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <item.icon
                      className="mt-0.5 size-4 shrink-0 text-acid"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-[14px] font-medium text-white">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-mute">
                        {item.description}
                      </span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
