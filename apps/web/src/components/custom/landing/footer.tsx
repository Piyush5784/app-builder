import { Terminal } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Templates", "Pricing", "Docs"],
  },
  {
    title: "Platform",
    links: ["GitHub", "Security"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms"],
  },
  {
    title: "Company",
    links: ["Contact"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Terminal className="size-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                WebApp Builder
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Describe it. AI builds it. Ship it.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-foreground/55 transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} Forgeframe. All rights reserved.
          </span>
          <span>Built for developers who ship.</span>
        </div>
      </div>
    </footer>
  );
}
