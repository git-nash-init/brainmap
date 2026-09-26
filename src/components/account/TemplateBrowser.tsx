"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

export type TemplateRow = { id: string; title: string; category: string; storage_path: string };

const previewOf = (t: TemplateRow) => `/templates-preview/${t.storage_path.split("/").pop()!.replace(/\.pdf$/i, "")}.jpg`;

/** Category filter pills + preview cards for the templates a customer owns. */
export function TemplateBrowser({ templates }: { templates: TemplateRow[] }) {
  const [active, setActive] = useState("All");

  const cats = useMemo(() => {
    const order: string[] = [];
    const count: Record<string, number> = {};
    templates.forEach((t) => {
      if (!(t.category in count)) { order.push(t.category); count[t.category] = 0; }
      count[t.category]++;
    });
    return [{ name: "All", n: templates.length }, ...order.map((name) => ({ name, n: count[name] }))];
  }, [templates]);

  const shown = active === "All" ? templates : templates.filter((t) => t.category === active);

  return (
    <div>
      {cats.length > 2 && (
        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="toolbar" aria-label="Filter templates by category">
          {cats.map((c) => {
            const on = c.name === active;
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(c.name)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-200 ${
                  on ? "border-ink bg-ink text-white shadow-md" : "border-line bg-white text-ink/75 hover:-translate-y-0.5 hover:border-ink hover:text-ink"
                }`}
              >
                {c.name}
                <span className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 ${on ? "bg-white/20 text-white" : "bg-ink/8 text-ink/60"}`}>{c.n}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-ink/50" aria-live="polite">
        Showing {shown.length} of {templates.length} template{templates.length === 1 ? "" : "s"}{active !== "All" ? ` in ${active}` : ""}
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex h-full flex-col rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-lg"
            >
              <a href={`/api/templates/${t.id}/download?inline=1`} target="_blank" rel="noopener" aria-label={`Preview ${t.title}`} className="zoom-img relative block aspect-[4/3] overflow-hidden rounded-xl bg-mist">
                <Image src={previewOf(t)} alt={`${t.title} template preview`} fill sizes="(min-width:1024px) 300px, (min-width:640px) 45vw, 90vw" className="object-cover" />
              </a>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-brand">{t.category}</p>
              <h3 className="font-bold leading-snug">{t.title}</h3>
              <div className="mt-auto flex gap-2 pt-4">
                <a href={`/api/templates/${t.id}/download`} className="btn inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-ink text-xs font-bold uppercase tracking-wider text-white">Download</a>
                <a href={`/api/templates/${t.id}/download?inline=1`} target="_blank" rel="noopener" className="btn inline-flex h-10 flex-1 items-center justify-center rounded-lg border-2 border-ink text-xs font-bold uppercase tracking-wider">Edit</a>
              </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
}
