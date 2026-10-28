import { ProductCard, type Product } from "@/components/patterns/commerce/product-card";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_PRODUCTS = 4;

export interface FeaturedCollectionProps {
  eyebrow?: string;
  heading: string;
  intro?: string;
  image: MediaImage;
  link: { label: string; href: string };
  products: readonly Product[];
}

export function FeaturedCollection({ eyebrow, heading, intro, image, link, products }: FeaturedCollectionProps) {
  return (
    <section data-section="commerce.featured-collection" className="bg-background text-foreground">
      <div className="mx-auto grid max-w-screen-2xl gap-8 px-4 py-20 md:grid-cols-12 md:px-8">
        <div className="md:col-span-7">
          <Media image={image} ratio="4:5" entrance="wipe" hover="zoom" sizes="(min-width: 768px) 58vw, 100vw" />
        </div>
        <div className="flex flex-col md:col-span-5">
          <Reveal>
            {eyebrow && <p className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
            <h2 className="mt-3 font-heading text-4xl font-bold uppercase leading-none tracking-tight md:text-5xl">{heading}</h2>
            {intro && <p className="mt-4 text-muted-foreground">{intro}</p>}
            <a href={link.href} className="mt-6 inline-flex min-h-6 items-center text-sm font-semibold uppercase tracking-wider underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {link.label}
            </a>
          </Reveal>
          {products.length > 0 && (
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-auto">
              {products.slice(0, MAX_PRODUCTS).map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
