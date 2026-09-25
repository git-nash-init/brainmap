import { Stagger, StaggerItem } from "@/components/ui/Reveal";

const items = [
  { t: "Instant access", d: "No shipping. Files and logins the moment you pay.", i: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z" },
  { t: "Private by design", d: "App data is encrypted on your device before it syncs.", i: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" },
  { t: "Print or go digital", d: "A4 / A3 PDFs for your wall, an app for your pocket.", i: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" },
  { t: "Human support", d: "Real help within 24 hours, Monday to Saturday.", i: "M4 12a8 8 0 1 1 16 0v4a2 2 0 0 1-2 2h-2v-6h4M4 12v4a2 2 0 0 0 2 2h2v-6H4" },
];

export function TrustStrip() {
  return (
    <Stagger className="mx-auto grid max-w-[1320px] gap-4 px-4 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
      {items.map((x) => (
        <StaggerItem key={x.t}>
          <div className="group flex h-full gap-4 rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={x.i} /></svg>
            </span>
            <div>
              <h3 className="text-sm font-bold">{x.t}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/65">{x.d}</p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
