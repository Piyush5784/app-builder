import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@package/ui/lib/utils";
import { Logo } from "./brand";
import { EASE } from "./shared";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#capabilities" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 16);
  });

  return (
    <header
      className={cn(
        "dark fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500",
        scrolled || open
          ? "border-white/[0.07] bg-void/75 backdrop-blur-xl"
          : "border-transparent",
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-6">
        <Logo />

        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[14px] text-mute transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/auth/login"
            className="hidden px-3 text-[14px] text-mute transition-colors hover:text-white sm:block"
          >
            Log in
          </Link>
          <Link
            to="/dashboard"
            className="hidden h-9 items-center rounded-full bg-acid px-4 text-[14px] font-medium text-void transition-colors hover:bg-[#d6ff6b] sm:inline-flex"
          >
            Start building
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-full border border-white/15 text-white lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden border-t border-white/[0.07] lg:hidden"
          >
            <div className="flex flex-col p-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3.5 text-[18px] text-white hover:bg-white/[0.04]"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3">
                <Link
                  to="/auth/login"
                  className="rounded-full border border-white/15 py-2.5 text-center text-[14px] text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-full bg-acid py-2.5 text-center text-[14px] font-medium text-void"
                >
                  Start building
                </Link>
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
