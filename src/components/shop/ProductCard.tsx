"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { inr, savePct, type Product } from "@/content/products";

const kindLabel = { template: "Printable", app: "App + Cloud", bundle: "Bundle" } as const;

/** Catalog card with gentle 3D tilt on hover. */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const v = product.variants[0];
  const from = Math.min(...product.variants.map((x) => x.price));
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      className="h-full"
    >
      <Link href={product.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,.35)]">
        <div className="zoom-img relative aspect-square overflow-hidden bg-mist">
          <Image src={product.image} alt={product.name} fill priority={priority} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{kindLabel[product.kind]}</span>
          <span className="absolute right-3 top-3 rounded-full bg-lime px-2.5 py-1 text-[10px] font-bold uppercase text-ink">Save {savePct(v.price, v.mrp)}%</span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-extrabold uppercase leading-tight">{product.name}</h3>
          <p className="mt-1 text-sm text-ink/65">{product.tagline}</p>
          <div className="mt-auto flex items-end justify-between pt-5">
            <p>
              <span className="text-lg font-bold">{product.variants.length > 1 ? "From " : ""}{inr(from)}</span>{" "}
              <span className="text-sm text-ink/45 line-through">{inr(v.mrp)}</span>
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-all group-hover:gap-2">
              View details <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
