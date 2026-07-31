import { WaitlistForm } from "./waitlist-form";

export function WaitlistCta({
  defaultRole,
}: {
  defaultRole?: "job_seeker" | "employer";
}) {
  return (
    <section id="waitlist" className="border-b border-border px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
          Jersey, first
        </p>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Be first through the door.
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-lg text-granite">
          We&rsquo;re opening with a small group of Jersey employers and
          candidates before anyone else. Join the waitlist to get in early.
        </p>
        <div className="mx-auto mt-10 max-w-md text-left">
          <WaitlistForm defaultRole={defaultRole} />
        </div>
      </div>
    </section>
  );
}
