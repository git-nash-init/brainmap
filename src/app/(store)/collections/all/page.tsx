import type { Metadata } from "next";
import { ProductCard } from "@/components/shop/ProductCard";
import { Container, SectionHeading } from "@/components/ui/Section";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { catalog } from "@/content/products";

export const metadata: Metadata = { title: "All products" };

export default function AllProducts() {
  return (
    <Container className="py-16">
      <SectionHeading eyebrow="Catalog" title="All products" sub="Printable planners, the private Brain Map OS app, and the bundle that saves you the most." />
      <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {catalog.map((p, i) => (
          <StaggerItem key={p.slug}><ProductCard product={p} priority={i === 0} /></StaggerItem>
        ))}
      </Stagger>
    </Container>
  );
}
