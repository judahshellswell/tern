import { SectionHeading } from "./how-it-works";

const pillars = [
  {
    title: "Verified before anything else",
    body: "Employers can't publish and job seekers can't apply until they're verified. It's the one gate everything else sits behind.",
  },
  {
    title: "Guardian consent for 16 &amp; 17 year olds",
    body: "A parent or guardian confirms they know their child is using Tern, before an account can go further than building a profile.",
  },
  {
    title: "No employer browsing, ever",
    body: "Employers only ever see candidates who applied to their own vacancies. There's no search-by-candidate feature anywhere in Tern — by design, not by setting.",
  },
  {
    title: "No open messaging",
    body: "Every message is a structured template — interview invites, information requests, status updates. No free text, no unsupervised chat, no way for a stranger to just message a candidate.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="border-b border-border px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Trust & safety"
          title="Built to be trusted by parents, not just users."
          lede="In a small community, reputations travel fast. Tern's safety model isn't a feature list bolted on afterward — it's the architecture."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-border-strong bg-paper-raised p-6"
            >
              <h3
                className="font-serif text-lg font-semibold"
                dangerouslySetInnerHTML={{ __html: pillar.title }}
              />
              <p className="mt-2 text-[15px] text-granite">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
