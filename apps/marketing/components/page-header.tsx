export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="border-b border-border px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl animate-rise">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">{eyebrow}</p>
        <h1 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {lede && <p className="mt-5 max-w-[60ch] text-lg text-granite">{lede}</p>}
      </div>
    </div>
  );
}
