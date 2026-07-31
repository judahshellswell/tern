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
          <Link href="/about" className="transition-colors hover:text-tide">
            About
          </Link>
          <Link href="/employers" className="transition-colors hover:text-tide">
            For employers
          </Link>
          <Link href="/faq" className="transition-colors hover:text-tide">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/#waitlist"
            className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright"
          >
            Join waitlist
          </Link>
        </div>
      </div>
    </header>
  );
}
