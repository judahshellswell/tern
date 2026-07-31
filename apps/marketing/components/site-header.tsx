import Link from "next/link";
import { Wordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-ink">
          <Wordmark className="text-lg" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-tide">
            How it works
          </a>
          <a href="#trust" className="transition-colors hover:text-tide">
            Trust &amp; safety
          </a>
          <a href="#employers" className="transition-colors hover:text-tide">
            For employers
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="#waitlist"
            className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright"
          >
            Join waitlist
          </a>
        </div>
      </div>
    </header>
  );
}
