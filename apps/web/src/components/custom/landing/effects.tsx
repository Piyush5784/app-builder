import * as React from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { EASE } from "./shared";

/**
 * "<prefix> <word>" where the word cycles in place. Both parts use layout
 * animation, so the centred line glides to its new width instead of jumping.
 * Screen readers get the full list once, not every change.
 */
export function RotatingWord({
  prefix,
  words,
  className = "",
}: {
  prefix: string;
  words: string[];
  className?: string;
}) {
  const [i, setI] = React.useState(0);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2400);
    return () => clearInterval(id);
  }, [reduced, words.length]);

  const transition = { duration: 0.6, ease: EASE };
  return (
    <LayoutGroup>
      <span className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.24em]">
        <motion.span layout="position" transition={transition}>
          {prefix}
        </motion.span>
        <span className="sr-only">{words.join(", ")}</span>
        <motion.span
          layout
          transition={transition}
          aria-hidden="true"
          className={`relative inline-flex overflow-hidden pb-[0.08em] ${className}`}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={words[i]}
              initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
              transition={transition}
              className="whitespace-nowrap"
            >
              {words[i]}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </span>
    </LayoutGroup>
  );
}

const GLYPHS = "ABCDEF0123456789#$%&@*+=/<>";

/** Text that encrypts into noise and decrypts back, on a loop, while visible. */
export function Scramble({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const [out, setOut] = React.useState(text);

  React.useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0;
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      // 0-30 encrypt, 30-55 hold noise, 55-85 decrypt, 85-120 hold plain
      const cycle = t % 120;
      const p =
        cycle < 30
          ? cycle / 30
          : cycle < 55
            ? 1
            : cycle < 85
              ? 1 - (cycle - 55) / 30
              : 0;
      frame++;
      setOut(
        text
          .split("")
          .map((ch, i) =>
            ch === " " || i / text.length >= p
              ? ch
              : GLYPHS[(i * 7 + frame) % GLYPHS.length],
          )
          .join(""),
      );
    }, 45);
    return () => clearInterval(id);
  }, [inView, reduced, text]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}
