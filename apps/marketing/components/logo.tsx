export function TernMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 15c3-1 5-4 7-7 1.5-2.3 3.2-4 5.5-4.5-1 1.8-1.3 3-1.3 4.2 0 2.6 2.2 4.3 5.3 4.3.9 0 1.8-.1 2.5-.3-1.6 2.4-4.6 3.8-7.8 3.3-1-.15-1.7-.1-2.4.4-1.8 1.3-4.2 2.9-6.8 3.6 1.6-1.3 2.7-2.6 3.2-3.7-2 .3-3.8.1-5.2-.3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-serif font-semibold tracking-tight ${className}`}
    >
      <TernMark className="h-[0.85em] w-[0.85em] text-tide" />
      Tern
    </span>
  );
}
