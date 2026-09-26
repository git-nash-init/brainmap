import type { Metadata } from "next";
import { MetaPixelOnHash } from "@/components/analytics/MetaPixelOnHash";
import { BuyBox } from "@/components/shop/BuyBox";
import { PhoneMockup } from "@/components/shop/PhoneMockup";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { secondBrain } from "@/content/products";

export const metadata: Metadata = {
  title: "Brain Map OS — your private second brain",
  description: "Goals, tasks, habits, notes, money, journal and an AI coach in one app. Your own login, end-to-end encrypted.",
};

const modules = [
  ["◎", "Life Score", "One number, six life areas — Business, Health, Finance, Learning, Relationships, Lifestyle."],
  ["✓", "Habit tracker", "Daily or weekly habits with streaks and a 30-day heatmap."],
  ["🎯", "Goals", "Annual, quarterly and monthly goals with progress sliders."],
  ["☰", "Tasks", "Today, inbox, upcoming — prioritised and dated."],
  ["✎", "Knowledge vault", "Notes, ideas, bookmarks and resources with tags and full-text search."],
  ["▦", "Projects kanban", "To do → in progress → in review → done, with progress bars."],
  ["₹", "Finance", "Income, expenses, savings goals and net worth in 50 currencies."],
  ["☾", "Journal", "Daily, weekly and gratitude entries with a mood chart."],
  ["✦", "Vision board", "Images and dreams grouped by life area."],
  ["↻", "Routines", "Morning, work, evening, weekly and monthly resets."],
  ["★", "Achievements", "12 badges and streak milestones that keep you going."],
  ["AI", "AI coach", "Plans your week and breaks goals into 90-day steps (bring your own free Gemini key)."],
];

const faqs = [
  { q: "How do I get my login?", a: <>Right after purchase you’re taken to your <b>Brain Map account</b>. Open <i>My Purchases → Brain Map OS</i> to see your app username, a temporary password and the live app link. You’ll be asked to choose your own password the first time you log in.</> },
  { q: "Is my data really private?", a: <>Yes. Everything you enter is encrypted <b>on your device</b> (AES-256) with a key derived from your password before it is synced. We store only ciphertext, so nobody at Brain Map can read your data. Keep your recovery code safe — it’s the only way to restore access if you forget your password.</> },
  { q: "Does it work on my phone?", a: <>Yes. Open the app link in your phone’s browser and choose <b>Add to Home Screen</b> (iPhone: Share → Add to Home Screen). It then behaves like a native app.</> },
  { q: "Do I need internet?", a: <>The app keeps working offline and syncs your changes when you’re back online.</> },
  { q: "What is the AI coach?", a: <>An optional feature. Paste your own free Google Gemini key in Settings and the coach uses your goals, habits and tasks for personalised plans. Your key stays on your device.</> },
  { q: "Is it a subscription?", a: <>No. One payment, lifetime access to the app.</> },
];

export default function SecondBrainPage() {
  return (
    <>
      {/* Meta Pixel: fires only for visitors arriving at /products/second-brain#buy (or pressing a button that jumps there) */}
      <MetaPixelOnHash id="1574306130677438" hash="#buy" />
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-brand/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-alert/25 blur-[120px]" />
        <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">Brain Map OS</p>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-[1] tracking-tight">Replace 10+ apps with <span className="text-lime">one private system.</span></h1>
            <p className="mt-5 max-w-lg text-white/70">Your life in one place — goals, habits, money, notes and an AI coach. Your own login. Your data, encrypted before it leaves your device.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#buy" variant="lime" size="lg">Get lifetime access</ButtonLink>
              <ButtonLink href="/products/bundle" variant="outline" size="lg" className="!border-white/60 !text-white hover:!bg-white hover:!text-ink">Save with the bundle</ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={0.1}><div className="animate-float"><PhoneMockup className="!w-[260px]" /></div></Reveal>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Inside the app" title="Twelve modules. Zero clutter." sub="Everything you were juggling across notes apps, spreadsheets, habit apps and finance trackers — finally in one calm place." />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" gap={0.05}>
            {modules.map(([g, t, d]) => (
              <StaggerItem key={t}>
                <div className="group h-full rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-ink hover:shadow-xl">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-lg text-lime transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">{g}</span>
                  <h3 className="mt-4 font-bold">{t}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink/65">{d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <section className="bg-mist py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Private by design</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl">Your second brain shouldn’t be someone else’s database.</h2>
            <p className="mt-4 text-ink/70">Every entry is locked with a key that only exists on your device. What we store in the cloud is unreadable ciphertext — so even we can’t see your goals, journal or finances.</p>
          </Reveal>
          <Stagger className="grid gap-3">
            {[
              ["Your own login", "A personal username and password for every buyer."],
              ["End-to-end encrypted", "AES-256-GCM in your browser; the key is derived from your password."],
              ["Recovery code", "Forgot your password? Your one-time recovery code restores everything."],
              ["Sync across devices", "Phone, tablet, laptop — always the latest version."],
            ].map(([t, d]) => (
              <StaggerItem key={t}>
                <div className="flex gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs text-white">✓</span>
                  <div><p className="font-bold">{t}</p><p className="text-sm text-ink/65">{d}</p></div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <section id="buy" className="scroll-mt-28 py-20">
        <Container className="grid items-start gap-12 lg:grid-cols-2">
          {/* phones: buy box first, setup steps below it; desktop: steps left, buy box right */}
          <Reveal className="order-2 lg:order-1">
            <SectionHeading center={false} eyebrow="Setup in minutes" title="From purchase to your first entry" />
            <ol className="space-y-5">
              {[
                ["Buy once", "Pay securely — no subscription."],
                ["Open My Purchases", "Your app username, temporary password and live app link appear instantly."],
                ["Install & log in", "Add to Home Screen, sign in, and set your own password."],
                ["Start tracking", "A 4-step onboarding tunes the app to your goals."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-bold text-lime">{i + 1}</span>
                  <div><p className="font-bold">{t}</p><p className="text-sm text-ink/65">{d}</p></div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1} className="order-1 rounded-3xl border border-line p-6 shadow-xl md:p-8 lg:order-2">
            <BuyBox product={secondBrain} kicker="Lifetime access" bullets={["🔐 Your own encrypted vault.", "📱 Works on phone, tablet and desktop."]} />
          </Reveal>
        </Container>
      </section>

      <section className="pb-16">
        <Container className="max-w-3xl">
          <SectionHeading title="Questions, answered" />
          <div className="rounded-2xl border border-line px-5 shadow-sm"><Accordion items={faqs} defaultOpen={0} /></div>
        </Container>
      </section>
      <TrustStrip />
    </>
  );
}
