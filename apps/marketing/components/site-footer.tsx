import { Wordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <Wordmark className="text-base text-ink" />
          <p className="mt-2 max-w-sm text-sm text-granite">
            The trusted way for Jersey&rsquo;s early-career talent and
            employers to find each other.
          </p>
        </div>
        <p className="font-mono text-xs text-granite-soft">
          &copy; {new Date().getFullYear()} Tern. Jersey &middot; Channel Islands &middot; UK, soon.
        </p>
      </div>
    </footer>
  );
}
