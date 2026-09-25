import type { Metadata } from "next";
import { Container } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contact Us" };

const hours = [
  ["🗓️", "Monday – Saturday"],
  ["⏰", "10:00 AM – 7:00 PM (IST)"],
  ["🚫", "Closed on Sundays & public holidays"],
];

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-16 md:py-24">
      <Reveal><h1 className="text-center font-display text-5xl font-extrabold tracking-tight md:text-6xl">Contact Us</h1></Reveal>
      <Stagger className="mt-14 grid gap-6 md:grid-cols-2">
        <StaggerItem>
          <div className="h-full rounded-2xl border border-line p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <h2 className="font-bold">Customer support email</h2>
            <a href={`mailto:${site.email}`} className="link-grow mt-4 inline-block text-lg font-bold [overflow-wrap:anywhere]">✉️ {site.email}</a>
            <h2 className="mt-6 font-bold">Call us</h2>
            <a href={site.phoneHref} className="link-grow mt-3 inline-block text-lg font-bold">📞 {site.phoneDisplay}</a>
            <p className="mt-3 text-sm text-ink/70">Our support team will respond to your queries within <b>24 hours</b> (Monday to Saturday).</p>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="h-full rounded-2xl border border-line p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <h2 className="font-bold">Business hours</h2>
            <ul className="mt-4 space-y-2 text-[15px]">{hours.map(([i, t]) => <li key={t}>{i} {t}</li>)}</ul>
          </div>
        </StaggerItem>
      </Stagger>
    </Container>
  );
}
