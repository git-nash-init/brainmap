import Image from "next/image";
import { HomeHero } from "@/components/shop/HomeHero";
import { ProductCard } from "@/components/shop/ProductCard";
import { TestimonialSlider } from "@/components/shop/TestimonialSlider";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { PhoneMockup } from "@/components/shop/PhoneMockup";
import { Marquee } from "@/components/ui/Marquee";
import { StatRing } from "@/components/ui/CountUp";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { catalog, testimonials, quickQuotes } from "@/content/products";

const quotes = [
  "You don't need motivation. You need a system and the discipline to follow it.",
  "You can't improve what you don't track — start today.",
];

const stats = [
  { v: 92, t: "Stayed consistent with at least one habit for 30+ days." },
  { v: 90, t: "Reported feeling more focused and intentional each day." },
  { v: 95, t: "Said physically checking off habits increased motivation." },
];

export default function Home() {
  return (
    <>
      <HomeHero />

      <Marquee className="border-y border-line bg-lime py-3">
        {[...quotes, ...quotes].map((q, i) => (
          <span key={i} className="mx-8 whitespace-nowrap text-sm font-semibold">“{q}” <span className="mx-8 text-brand">✦</span></span>
        ))}
      </Marquee>

      {/* catalog */}
      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="The Brain Map catalog" title="Everything you need to run your month — and your life" sub="Start with the printable system, add the private app, or save big with the bundle." />
          <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {catalog.map((p, i) => (
              <StaggerItem key={p.slug}><ProductCard product={p} priority={i === 0} /></StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* results */}
      <section className="bg-mist py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Results</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/70">
              More consistency. Better routines. Stronger habits. See how simple daily tracking helps people make meaningful progress toward their goals.
            </p>
          </Reveal>
          <div>
            <Reveal><h3 className="font-display text-2xl font-extrabold">Why people stick with it</h3></Reveal>
            <Stagger className="mt-4 divide-y divide-line border-y border-line">
              {stats.map((s) => (
                <StaggerItem key={s.v}>
                  <div className="flex items-center gap-4 py-4 sm:gap-5">
                    <StatRing value={s.v} size={72} />
                    <p className="min-w-0 flex-1 text-[14px] leading-snug text-ink/80">{s.t}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-3 text-xs text-ink/55">See the difference consistent tracking can make.</p>
          </div>
        </Container>
      </section>

      {/* featured habit */}
      <section className="py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="zoom-img relative aspect-square overflow-hidden rounded-3xl bg-ink">
            <Image src="/images/habit-main.png" alt="Monthly habit wheel planner" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Featured · Printable</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight">Brain Map Habit Tracker</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink/70">A visual 31-day wheel plus 20+ printable planners that turn habits into something you can see. Print it, hang it, fill it in — no motivation required.</p>
            <p className="mt-5 flex items-baseline gap-3"><b className="text-2xl">Rs. 199</b><s className="text-ink/45">Rs. 499</s><span className="rounded-md bg-brand px-2 py-1 text-[11px] font-bold text-white">SAVE 60%</span></p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/products/habit" size="lg">View details</ButtonLink>
              <ButtonLink href="/products/bundle" variant="outline" size="lg">See the bundle</ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* app teaser */}
      <section className="relative overflow-hidden bg-ink py-20 text-white">
        <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-alert/20 blur-[120px]" />
        <Container className="relative grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">New · Brain Map OS</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Your second brain. <span className="text-lime">Fully private.</span></h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">Goals, tasks, habits, notes, money, journal and an AI coach — in one app with your own login. Everything is encrypted on your device before it ever touches the cloud.</p>
            <ul className="mt-6 grid max-w-lg gap-2 text-sm text-white/85 sm:grid-cols-2">
              {["Life Score dashboard", "Habit streaks & heatmaps", "Finance in 50 currencies", "Notes vault & journal", "Projects kanban", "AI coach (bring your key)"].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-lime">✓</span>{f}</li>
              ))}
            </ul>
            <div className="mt-8"><ButtonLink href="/products/second-brain" variant="lime" size="lg">Explore Brain Map OS</ButtonLink></div>
          </Reveal>
          <Reveal delay={0.1}><div className="animate-float"><PhoneMockup /></div></Reveal>
        </Container>
      </section>

      {/* reviews */}
      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Consistency wins" title="People who stopped guessing" />
          <TestimonialSlider items={[...testimonials, ...quickQuotes.map((q) => ({ name: q.name, text: q.text }))]} />
        </Container>
      </section>

      <section className="pb-4"><TrustStrip /></section>
    </>
  );
}
