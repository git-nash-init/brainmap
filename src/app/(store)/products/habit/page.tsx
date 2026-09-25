import type { Metadata } from "next";
import Image from "next/image";
import { BuyBox } from "@/components/shop/BuyBox";
import { TestimonialSlider } from "@/components/shop/TestimonialSlider";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { Gallery } from "@/components/ui/Gallery";
import { Accordion } from "@/components/ui/Accordion";
import { Marquee } from "@/components/ui/Marquee";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { habit, planningTemplates, testimonials } from "@/content/products";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Brain Map Habit Tracker — printable 31-day system",
  description: "Build consistency with a visual 31-day habit wheel plus 20+ printable planning templates. Instant download.",
};

const gallery = ["/images/habit-main.png", "/images/habit-how.png", "/images/habit-clarity.png", "/images/templates-collage.png", "/images/templates-harada.png"];

const faqs = [
  { q: "What exactly is the Brain Map Habit Tracker?", a: <>The Habit Tracker by <b>Brain Map</b> is a visual planning system designed to help you build consistency through daily action. You track habits visually, day by day, for an entire month. No motivation. Just structure and discipline.</> },
  { q: "Is this a physical product? How do I receive the file?", a: <>No. This is a <b>digital product</b>. Images shown printed for display purposes only. After purchase you get instant access — you’ll receive an <b>instant download link</b> and a login to your Brain Map account where every file lives. No waiting. No delays.</> },
  { q: "How do I use the Brain Map Habit Tracker?", a: <>Download the files and print on A4 for compact use or A3 for a bigger view. Use regular copy paper with a ballpoint or fineliner, and colour markers to shade the rings (🟢 done · 🔴 missed). Laminate and stick it on your wall to reuse every month with dry-erase markers — optional.</> },
  { q: "Is this useful if I have little time or feel disorganized?", a: <>That’s exactly who it’s for. This planning system doesn’t ask you to change your life overnight. It gives you a <b>clear structure to start today</b>.</> },
  { q: "What if I have a problem with downloading the file?", a: <>We provide support. If you can’t access it or have any trouble downloading, we’ll help you until you have it correctly — write to <a className="link-grow font-semibold" href={`mailto:${site.email}`}>{site.email}</a>.</> },
];

const details = [
  { q: "What you'll receive", a: <>After purchase you’ll receive an <b>instant download link</b> and access in your Brain Map account (PDF &amp; PNG formats). Any future updates to the files are added there automatically.</> },
  { q: "How to use the templates?", a: <ul className="list-disc space-y-1 pl-5"><li>Download the files and print on A4 for compact use or A3 for a bigger view.</li><li>Print as many copies as you need — at home or any shop for under ₹10.</li><li>Laminate and stick on your wall for repeated use with dry-erase markers (optional).</li></ul> },
  { q: "Service guarantee", a: <>This is a digital product. If you experience any issues with the download or the file, we provide immediate support until everything is working correctly. Digital products are non-refundable.</> },
  { q: "Instant delivery", a: <>No shipping. No waiting. Once you complete your purchase, you get immediate access and can start using it the same day.</> },
];

export default function HabitPage() {
  return (
    <>
      <Container className="grid gap-10 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-14">
        <Gallery images={gallery} alt="Brain Map Habit Tracker" />
        <div>
          <BuyBox
            product={habit}
            kicker="Your result starts here"
            bullets={["🖨️ Printable digital templates.", "🎯 Not motivation. Just discipline."]}
            timer
            watching
          />
          <div className="mt-8 rounded-xl border border-line px-5">
            <Accordion items={details} defaultOpen={0} />
          </div>
          <p className="mt-5 rounded-xl border-2 border-dashed border-ink/40 p-4 text-sm"><b>VIRAL RIGHT NOW!</b> Our Full Planning System is in high demand. Extra offer on checkout.</p>
        </div>
      </Container>

      <section className="py-12">
        <Container>
          <SectionHeading eyebrow="Full Planning System" title="20+ templates. One wall. One month." />
          <Stagger className="mx-auto grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4" gap={0.04}>
            {planningTemplates.map((t) => (
              <StaggerItem key={t}>
                <div className="rounded-lg border border-brand/30 bg-lime/40 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-1 hover:bg-lime hover:shadow-md">{t}</div>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
            {["/images/steps.webp"].map((s) => (
              <Reveal key={s} className="md:col-span-3"><Image src={s} alt="Download, print, use" width={900} height={300} className="mx-auto h-auto w-full max-w-3xl" /></Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-sm font-bold text-brand">GET 20+ NEW TEMPLATES WHEN YOU BUY THE FULL PLANNING SYSTEM</p>
        </Container>
      </section>

      <section className="bg-ink py-16 text-center text-white">
        <Container>
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold md:text-5xl">From intention to action.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">Planning means nothing if you don’t execute. This tracker is designed to move you from <i>“I want to do it”</i> to <b className="text-lime">“It’s done.”</b></p>
          </Reveal>
        </Container>
      </section>

      <Marquee className="border-b border-line bg-lime py-3" slow>
        {["You don't need motivation. You need a system and the discipline to follow it.", "You can't improve what you don't track — start today."].map((q, i) => (
          <span key={i} className="mx-8 whitespace-nowrap text-sm font-semibold">“{q}” <span className="mx-8 text-brand">✦</span></span>
        ))}
      </Marquee>

      <section className="py-16">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="A system for" title="Top achievers" />
          <div className="rounded-2xl border border-line px-5 shadow-sm"><Accordion items={faqs} defaultOpen={0} /></div>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <SectionHeading title="Consistency Wins+" />
          <TestimonialSlider items={testimonials} />
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <div className="flex flex-col items-center justify-between gap-5 rounded-3xl bg-lime p-8 text-center md:flex-row md:text-left">
            <div>
              <h2 className="font-display text-2xl font-extrabold">Want the paper and the app?</h2>
              <p className="mt-1 text-sm text-ink/75">Get the Full Planning System plus lifetime Brain Map OS in one bundle.</p>
            </div>
            <ButtonLink href="/products/bundle" size="lg">See the bundle</ButtonLink>
          </div>
        </Container>
      </section>
      <TrustStrip />
    </>
  );
}
