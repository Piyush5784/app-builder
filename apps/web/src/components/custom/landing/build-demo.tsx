import * as React from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  Check,
  Code2,
  CornerDownLeft,
  Eye,
  FileCode2,
  Loader2,
  Terminal,
} from "lucide-react";
import { cn } from "@package/ui/lib/utils";
import { highlight } from "./code";
import { EASE } from "./shared";

type Phase = "typing" | "working" | "streaming" | "done";

type Demo = {
  id: string;
  tab: string;
  prompt: string;
  steps: string[];
  code: string[];
  time: string;
  Preview: () => React.JSX.Element;
};

const TYPE_MS = 26;
const STEP_MS = 520;
const LINE_MS = 70;
const HOLD_MS = 4600;

function CoffeePreview() {
  return (
    <div className="flex h-full flex-col bg-[#120d0a] text-white">
      <div className="flex items-center justify-between px-5 py-3 text-[10px] text-white/60">
        <span className="font-semibold text-white">☕ BeanBox</span>
        <span className="flex gap-3">
          <span>Features</span>
          <span>Plans</span>
          <span className="rounded bg-white px-2 py-0.5 text-[#120d0a]">
            Get started
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_20%,rgba(234,115,23,0.25),transparent_60%)] px-6 text-center">
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[9px] text-white/60">
          New summer roasts
        </span>
        <p className="mt-3 text-[22px] leading-tight font-bold tracking-tight">
          Discover your perfect
          <br />
          <span className="text-orange-500">daily brew</span>
        </p>
        <p className="mt-2 max-w-[36ch] text-[10px] text-white/55">
          Specialty coffee from award-winning roasters, delivered fresh to your
          door.
        </p>
        <span className="mt-4 rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-semibold">
          Find my coffee match →
        </span>
        <div className="mt-6 grid grid-cols-3 gap-6 text-center">
          {[
            ["50+", "Roasters"],
            ["120+", "Coffees"],
            ["4.9★", "Rating"],
          ].map(([v, l]) => (
            <span key={l}>
              <span className="block text-[15px] font-bold text-orange-500">
                {v}
              </span>
              <span className="text-[9px] text-white/50">{l}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const bars = [40, 62, 48, 75, 58, 88, 70];
  return (
    <div className="flex h-full bg-[#0b0d12] text-white">
      <div className="hidden w-28 shrink-0 flex-col gap-1.5 border-r border-white/10 p-3 text-[10px] text-white/55 sm:flex">
        <span className="mb-2 font-semibold text-white">◆ Pulse</span>
        {["Overview", "Customers", "Revenue", "Settings"].map((l, i) => (
          <span
            key={l}
            className={cn(
              "rounded px-2 py-1",
              i === 0 && "bg-white/10 text-white",
            )}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-[12px] font-semibold">Overview</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["MRR", "$48.2k", "+12%"],
            ["Users", "3,914", "+8%"],
            ["Churn", "1.8%", "−0.4"],
          ].map(([k, v, d]) => (
            <div key={k} className="rounded-lg border border-white/10 p-2">
              <p className="text-[9px] text-white/50">{k}</p>
              <p className="text-[14px] font-bold">{v}</p>
              <p className="text-[9px] text-emerald-400">{d}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-1 items-end gap-2 rounded-lg border border-white/10 p-3">
          {bars.map((h, i) => (
            <motion.span
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.05 }}
              className={cn(
                "flex-1 rounded-t",
                i === 5 ? "bg-indigo-400" : "bg-white/15",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] px-5 text-[#111]">
      <p className="text-[16px] font-bold tracking-tight">
        Simple, honest pricing
      </p>
      <div className="grid w-full grid-cols-3 gap-2">
        {[
          ["Starter", "$9"],
          ["Pro", "$29"],
          ["Team", "$79"],
        ].map(([n, p], i) => (
          <div
            key={n}
            className={cn(
              "rounded-lg border p-3",
              i === 1
                ? "border-violet-500 bg-violet-50 shadow-sm"
                : "border-black/10 bg-white",
            )}
          >
            <p className="text-[10px] font-semibold">{n}</p>
            <p className="mt-1 text-[16px] font-bold">
              {p}
              <span className="text-[9px] font-normal text-black/50">/mo</span>
            </p>
            {["Projects", "Support", "Analytics"].map((f) => (
              <p key={f} className="mt-1 text-[9px] text-black/55">
                ✓ {f}
              </p>
            ))}
            <span
              className={cn(
                "mt-2 block rounded py-1 text-center text-[9px] font-semibold",
                i === 1 ? "bg-violet-600 text-white" : "bg-black/5",
              )}
            >
              Choose
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMOS: Demo[] = [
  {
    id: "coffee",
    tab: "coffee-landing",
    prompt:
      "A landing page for a coffee subscription box, with plans, reviews and an FAQ",
    steps: [
      "Planning 8 sections",
      "Editing src/App.tsx",
      "Installing lucide-react",
      "Running npm run build",
    ],
    time: "1m 12s",
    code: [
      'import { Coffee } from "lucide-react";',
      'import { Button } from "@/components/ui/button";',
      "",
      "export default function App() {",
      "  return (",
      '    <main className="bg-stone-950 text-white">',
      '      <section className="py-28 text-center">',
      "        <h1>Discover your perfect daily brew</h1>",
      "        <Button>Find my coffee match</Button>",
      "      </section>",
      "      <Plans />",
      "      <Reviews />",
      "    </main>",
      "  );",
      "}",
    ],
    Preview: CoffeePreview,
  },
  {
    id: "dashboard",
    tab: "saas-dashboard",
    prompt:
      "A SaaS dashboard with a sidebar, KPI cards and a weekly revenue chart",
    steps: [
      "Planning layout and routes",
      "Creating src/pages/Overview.tsx",
      "Installing recharts",
      "Running npm run build",
    ],
    time: "1m 34s",
    code: [
      'import { Sidebar } from "@/components/Sidebar";',
      'import { KpiCard } from "@/components/KpiCard";',
      "",
      "export function Overview() {",
      "  const { data } = useRevenue();",
      "  return (",
      '    <div className="flex min-h-screen">',
      "      <Sidebar />",
      '      <section className="grid gap-4 p-8">',
      '        <KpiCard label="MRR" value={data.mrr} />',
      "        <RevenueChart points={data.weekly} />",
      "      </section>",
      "    </div>",
      "  );",
      "}",
    ],
    Preview: DashboardPreview,
  },
  {
    id: "pricing",
    tab: "pricing-page",
    prompt: "A pricing page with three tiers, a highlighted plan and a FAQ",
    steps: [
      "Planning 3 tiers",
      "Editing src/components/Pricing.tsx",
      "Fixing a type error",
      "Running npm run build",
    ],
    time: "48s",
    code: [
      "const plans = [",
      '  { name: "Starter", price: 9 },',
      '  { name: "Pro", price: 29, featured: true },',
      '  { name: "Team", price: 79 },',
      "];",
      "",
      "export function Pricing() {",
      "  return (",
      '    <div className="grid gap-6 md:grid-cols-3">',
      "      {plans.map((plan) => (",
      "        <PlanCard key={plan.name} {...plan} />",
      "      ))}",
      "    </div>",
      "  );",
      "}",
    ],
    Preview: PricingPreview,
  },
];

export function BuildDemo() {
  const frame = React.useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { margin: "0px 0px -20% 0px" });
  const reduced = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("typing");
  const [chars, setChars] = React.useState(0);
  const [steps, setSteps] = React.useState(0);
  const [lines, setLines] = React.useState(0);
  const [view, setView] = React.useState<"code" | "preview">("code");

  const demo = DEMOS[index];
  // Reduced motion shows every demo already finished, nothing animates.
  const shown = reduced
    ? {
        phase: "done" as Phase,
        chars: demo.prompt.length,
        steps: demo.steps.length,
        lines: demo.code.length,
      }
    : { phase, chars, steps, lines };

  // One small state machine: type the prompt → tick the agent's steps →
  // stream the code → show the preview → next demo.
  React.useEffect(() => {
    if (reduced || !inView) return;
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (chars < demo.prompt.length)
        t = setTimeout(() => setChars((c) => c + 1), TYPE_MS);
      else t = setTimeout(() => setPhase("working"), 350);
    } else if (phase === "working") {
      if (steps < demo.steps.length - 1)
        t = setTimeout(() => setSteps((s) => s + 1), STEP_MS);
      else t = setTimeout(() => setPhase("streaming"), STEP_MS);
    } else if (phase === "streaming") {
      if (lines < demo.code.length)
        t = setTimeout(() => setLines((l) => l + 1), LINE_MS);
      else
        t = setTimeout(() => {
          setSteps(demo.steps.length);
          setPhase("done");
          setView("preview");
        }, 300);
    } else {
      t = setTimeout(() => select((index + 1) % DEMOS.length), HOLD_MS);
    }
    return () => clearTimeout(t);
  });

  function select(i: number) {
    setIndex(i);
    setChars(0);
    setSteps(0);
    setLines(0);
    setPhase("typing");
    setView("code");
  }

  // The window leans back and straightens as it scrolls into view.
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start end", "start 0.35"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  const busy = shown.phase === "working" || shown.phase === "streaming";
  const done = shown.phase === "done";
  const activeView = reduced ? "preview" : view;

  return (
    <div
      id="demo"
      className="relative mx-auto mt-16 max-w-[1080px] scroll-mt-28 [perspective:1600px] sm:mt-20"
    >
      <div
        className="absolute -inset-x-10 -top-10 bottom-0 rounded-[40px] bg-acid/10 blur-[90px]"
        aria-hidden="true"
      />
      <motion.div
        ref={frame}
        style={
          reduced ? undefined : { rotateX, scale, transformOrigin: "50% 0%" }
        }
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-coal/95 text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-white/10" />
            <span className="size-3 rounded-full bg-white/10" />
            <span className="size-3 rounded-full bg-white/10" />
          </span>
          <div
            role="tablist"
            aria-label="Example builds"
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
          >
            {DEMOS.map((d, i) => (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => select(i)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 font-code text-[12px] transition-colors",
                  i === index
                    ? "bg-white/[0.07] text-white"
                    : "text-dim hover:text-mute",
                )}
              >
                <FileCode2
                  className={cn("size-[13px]", i === index && "text-acid")}
                  aria-hidden="true"
                />
                {d.tab}
              </button>
            ))}
          </div>
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-code text-[11px] transition-colors sm:inline-flex",
              done
                ? "border-acid/30 bg-acid/10 text-acid"
                : "border-white/10 text-mute",
            )}
            aria-live="polite"
          >
            {busy ? (
              <Loader2
                className="size-[11px] animate-spin"
                aria-hidden="true"
              />
            ) : (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  done ? "bg-acid" : "bg-white/30",
                )}
              />
            )}
            {done
              ? `Working app in ${demo.time}`
              : busy
                ? "Agent working…"
                : "Waiting for prompt"}
          </span>
        </div>

        <div className="grid md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5 border-b border-white/[0.07] p-4 md:border-r md:border-b-0">
            <div>
              <p className="font-code text-[11px] tracking-[0.14em] text-dim uppercase">
                You
              </p>
              <div className="mt-2 rounded-xl border border-white/10 bg-void/60 p-3">
                <p className="min-h-[66px] text-[14px] leading-relaxed text-white/85">
                  {demo.prompt.slice(0, shown.chars)}
                  {shown.phase === "typing" ? (
                    <span
                      className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-blink bg-acid"
                      aria-hidden="true"
                    />
                  ) : null}
                </p>
                <div className="mt-3 flex justify-end">
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-lg transition-colors",
                      shown.phase === "typing"
                        ? "bg-white/10 text-mute"
                        : "bg-acid text-void",
                    )}
                    aria-hidden="true"
                  >
                    <CornerDownLeft className="size-3.5" />
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-code text-[11px] tracking-[0.14em] text-dim uppercase">
                Agent
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {demo.steps.map((s, i) => {
                  const ok = shown.phase !== "typing" && i < shown.steps;
                  const running = busy && i === shown.steps;
                  return (
                    <li
                      key={s}
                      className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 font-code text-[12px]"
                    >
                      {i === demo.steps.length - 1 ? (
                        <Terminal
                          className="size-3.5 shrink-0 text-dim"
                          aria-hidden="true"
                        />
                      ) : (
                        <FileCode2
                          className="size-3.5 shrink-0 text-dim"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          ok || running ? "text-white/85" : "text-dim",
                        )}
                      >
                        {s}
                      </span>
                      {ok ? (
                        <Check
                          className="size-3.5 shrink-0 text-acid"
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                      ) : running ? (
                        <Loader2
                          className="size-3.5 shrink-0 animate-spin text-mute"
                          aria-hidden="true"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="relative flex min-h-[420px] flex-col bg-void/40">
            <div className="flex items-center gap-1 border-b border-white/[0.07] px-3 py-2">
              {(
                [
                  ["preview", Eye, "Preview"],
                  ["code", Code2, "Code"],
                ] as const
              ).map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors",
                    activeView === key
                      ? "bg-white/[0.08] text-white"
                      : "text-dim hover:text-mute",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
              <span className="ml-auto truncate font-code text-[11px] text-dim">
                localhost:5173
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {activeView === "preview" && done ? (
                  <motion.div
                    key={`preview-${demo.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="absolute inset-0"
                  >
                    <demo.Preview />
                  </motion.div>
                ) : activeView === "preview" ? (
                  <motion.div
                    key="building"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 grid place-items-center font-code text-[12px] text-dim"
                  >
                    <span className="flex items-center gap-2">
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      Building preview…
                    </span>
                  </motion.div>
                ) : (
                  <motion.pre
                    key={`code-${demo.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 overflow-x-auto p-4 font-code text-[12.5px] leading-[1.75] sm:text-[13px]"
                    aria-label={`Generated code for ${demo.tab}`}
                  >
                    <code>
                      {demo.code.map((line, i) => (
                        <motion.div
                          key={`${demo.id}-${i}`}
                          initial={false}
                          animate={{
                            opacity: i < shown.lines ? 1 : 0,
                            x: i < shown.lines ? 0 : -6,
                          }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="flex"
                        >
                          <span className="mr-5 w-6 shrink-0 text-right text-white/20 select-none">
                            {i + 1}
                          </span>
                          <span className="whitespace-pre text-white/80">
                            {highlight(line)}
                            {shown.phase === "streaming" &&
                            i === shown.lines - 1 ? (
                              <span
                                className="ml-px inline-block h-[1.05em] w-[7px] translate-y-[3px] animate-blink bg-acid/80"
                                aria-hidden="true"
                              />
                            ) : null}
                          </span>
                        </motion.div>
                      ))}
                    </code>
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
