import Link from "next/link";
import { Wordmark } from "./logo";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#trust", label: "Trust & safety" },
      { href: "/employers", label: "For employers" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Wordmark className="text-base text-ink" />
            <p className="mt-2 text-sm text-granite">
              The trusted way for Jersey&rsquo;s early-career talent and
              employers to find each other.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 sm:gap-14">
            {columns.map((column) => (
              <div key={column.heading}>
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
                  {column.heading}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink transition-colors hover:text-tide"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="font-mono text-xs text-granite-soft">
            &copy; {new Date().getFullYear()} Tern. Jersey &middot; Channel Islands &middot; UK, soon.
          </p>
        </div>
      </div>
    </footer>
  );
}
