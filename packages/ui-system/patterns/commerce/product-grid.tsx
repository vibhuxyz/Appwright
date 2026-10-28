import {
  ProductCard,
  type Product,
} from "@/components/patterns/commerce/product-card";
import { Reveal } from "@/components/patterns/shared/reveal";

const STAGGER_S = 0.05;
const STAGGER_RESET = 4;

export interface ProductGridProps {
  heading: string;
  countLabel?: string;
  products: readonly Product[];
  emptyMessage?: string;
}

export function ProductGrid({
  heading,
  countLabel,
  products,
  emptyMessage = "No products here yet.",
}: ProductGridProps) {
  return (
    <section
      data-section="commerce.product-grid"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-8">
        <header className="flex items-baseline gap-3">
          <h2 className="font-heading text-2xl font-bold">{heading}</h2>
          {countLabel && <p className="text-muted-foreground">{countLabel}</p>}
        </header>
        {products.length === 0 ? (
          <p className="mt-10 text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
              <li key={product.id}>
                <Reveal delay={(index % STAGGER_RESET) * STAGGER_S}>
                  <ProductCard product={product} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
