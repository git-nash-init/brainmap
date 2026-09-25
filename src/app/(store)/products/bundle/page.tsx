import type { Metadata } from "next";
import Image from "next/image";
import { BuyBox } from "@/components/shop/BuyBox";
import { PhoneMockup } from "@/components/shop/PhoneMockup";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { Accordion } from "@/components/ui/Accordion";
import { Container, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { bundle, habit, secondBrain, inr } from "@/content/products";

export const metadata: Metadata = {
  title: "The Brain Map Bundle — planners + private app",
  description: "20+ printable templates and lifetime Brain Map OS access in one bundle.",
};

const rows: [string, boolean, boolean][] = [
  ["Works without a screen", true, false],
  ["Print as many copies as you like", true, false],
  ["Auto-calculated Life Score & streaks", false, true],
  ["Encrypted cloud sync across devices", false, true],
  ["AI coach & weekly review", false, true],
  ["Finance, notes, journal, projects", false, true],
  ["Wall-ready visual habit wheel", true, false],
];

export default function BundlePage() {
  const total = habit.variants[0].price + secondBrain.variants[0].price;
  const b = bundle.variants[0];
  return (
    <>
      <Container className="grid gap-10 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-14">
        <Reveal className="relative aspect-square overflow-hidden rounded-3xl bg-mist lg:sticky lg:top-28 lg:self-start">
          <Image src="/images/bundle.jpg" alt="Printable planners and the Brain Map OS app" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </Reveal>
        <div>
          <BuyBox
            product={bundle}
            kicker="Best value"
            bullets={["🖨️ Full Planning System — 20+ printable templates.", "📱 Brain Map OS — lifetime access with your own login.", "🔐 End-to-end encrypted cloud vault."]}
            timer
            note={`Bought separately: ${inr(total)}. Bundle: ${inr(b.price)}.`}
          />
        </div>
      </Container>

      <section className="bg-mist py-20">
        <Container>
          <SectionHeading eyebrow="What’s inside" title="Paper on your wall. Brain in your pocket." />
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <Image src="/images/habit-main.png" alt="" width={420} height={420} className="mx-auto h-56 w-auto rounded-2xl object-cover" />
              <h3 className="mt-5 font-display text-2xl font-extrabold">Full Planning System</h3>
              <p className="text-sm text-ink/65">Monthly wheel + 20+ printable templates in your account, ready to download and edit.</p>
              <p className="mt-3 text-sm"><s className="text-ink/45">{inr(habit.variants[0].mrp)}</s> <b>{inr(habit.variants[0].price)}</b></p>
            </Reveal>
            <Reveal delay={0.1} className="rounded-3xl bg-ink p-6 text-white md:p-8">
              <div className="flex h-56 justify-center overflow-hidden"><PhoneMockup className="!w-[190px]" /></div>
              <h3 className="mt-5 font-display text-2xl font-extrabold">Brain Map OS</h3>
              <p className="text-sm text-white/65">Your private second brain — your own login, encrypted sync, lifetime access.</p>
              <p className="mt-3 text-sm"><s className="text-white/45">{inr(secondBrain.variants[0].mrp)}</s> <b>{inr(secondBrain.variants[0].price)}</b></p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <SectionHeading title="Better together" sub="Use paper for what you want to see every day. Use the app for everything you want to remember, measure and keep private." />
          <Reveal className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink text-white"><tr><th className="p-4 font-semibold">&nbsp;</th><th className="p-4 text-center font-semibold">Printables</th><th className="p-4 text-center font-semibold">Brain Map OS</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map(([t, a, c]) => (
                  <tr key={t} className="transition-colors hover:bg-lime/30">
                    <td className="p-4">{t}</td>
                    <td className="p-4 text-center">{a ? <span className="text-brand">✓</span> : <span className="text-ink/25">—</span>}</td>
                    <td className="p-4 text-center">{c ? <span className="text-brand">✓</span> : <span className="text-ink/25">—</span>}</td>
                  </tr>
                ))}
                <tr className="bg-lime/50 font-bold"><td className="p-4">Bundle price</td><td colSpan={2} className="p-4 text-center">{inr(b.price)} <s className="ml-2 font-normal text-ink/45">{inr(total)}</s></td></tr>
              </tbody>
            </table>
          </Reveal>
        </Container>
      </section>

      <section className="pb-16">
        <Container className="max-w-3xl">
          <div className="rounded-2xl border border-line px-5 shadow-sm">
            <Accordion
              defaultOpen={0}
              items={[
                { q: "What do I receive after buying the bundle?", a: <>Instant access to your Brain Map account: all printable templates to download, and your Brain Map OS login with the live app link.</> },
                { q: "Can I edit the templates?", a: <>Yes — the PDFs have fillable fields you can type into and edit, or print and fill by hand.</> },
                { q: "Can I upgrade later?", a: <>If you already own one product, write to us and we’ll credit it toward the bundle.</> },
              ]}
            />
          </div>
        </Container>
      </section>
      <TrustStrip />
    </>
  );
}
