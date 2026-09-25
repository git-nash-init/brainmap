/** PostgREST returns many-to-one embeds as an object; untyped clients infer an array. Normalise to a single value. */
export const one = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export type ProductRef = { id: string; name: string; kind: string };

export const productsOf = (items: { products: ProductRef | ProductRef[] | null }[] | null | undefined): ProductRef[] =>
  (items ?? []).flatMap((i) => {
    const p = one(i.products);
    return p ? [p] : [];
  });
