import { BRAND, Logo } from "./brand";
import { Container } from "./shared";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#capabilities" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "GitHub", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Contact", href: "#" }],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06]">
      <Container className="pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-mute">
              Describe it. AI builds it. Ship it.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-mute">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-acid/70" />
                <span className="relative size-2 rounded-full bg-acid" />
              </span>
              Sandboxes online
            </span>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-medium text-white">
                  {col.title}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5 text-[14px]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-mute transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <p
        aria-hidden="true"
        className="pointer-events-none mt-10 bg-[linear-gradient(180deg,rgba(200,255,61,0.22),rgba(255,255,255,0.04)_55%,transparent_85%)] bg-clip-text text-center text-[34vw] leading-[0.8] font-semibold tracking-[-0.07em] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgba(255,255,255,0.16)]"
      >
        {BRAND}
      </p>

      <Container className="relative flex flex-col gap-3 border-t border-white/[0.06] py-6 text-[12px] text-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {BRAND}. All rights reserved.
        </p>
        <p>Built for developers who ship.</p>
      </Container>
    </footer>
  );
}
