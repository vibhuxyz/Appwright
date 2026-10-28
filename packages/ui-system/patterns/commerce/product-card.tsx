import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import { Media, type MediaImage } from "@/components/patterns/shared/media";

export interface Product {
  id: string;
  href: string;
  name: string;
  brand?: string;
  image: MediaImage;
  price: string;
  compareAtPrice?: string;
  discountLabel?: string;
  badge?: string;
  rating?: string;
  ratingCount?: string;
}

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
        <a
          href={product.href}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Media
            image={product.image}
            ratio="3:4"
            sizes="(min-width: 1024px) 22vw, 50vw"
            imageClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </a>
        {product.badge && (
          <span className="absolute top-3 left-3 bg-primary px-2 py-0.5 text-xs font-semibold uppercase text-primary-foreground">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          aria-label={
            isSaved
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          aria-pressed={isSaved}
          onClick={() => setIsSaved((saved) => !saved)}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground transition-transform duration-150 ease-out motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Heart
            className={cn("size-4", isSaved && "fill-current text-primary")}
            aria-hidden="true"
          />
        </button>
        {product.rating && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/90 px-2 py-0.5 text-xs font-medium">
            {product.rating}
            <Star
              className="size-3 fill-current text-primary"
              aria-hidden="true"
            />
            {product.ratingCount && (
              <span className="text-muted-foreground">
                | {product.ratingCount}
              </span>
            )}
          </span>
        )}
      </div>
      <a href={product.href} className="mt-3 block">
        {product.brand && (
          <p className="text-sm font-bold uppercase tracking-wide">
            {product.brand}
          </p>
        )}
        <h3 className="truncate text-sm text-muted-foreground">
          {product.name}
        </h3>
      </a>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-semibold">{product.price}</span>
        {product.compareAtPrice && (
          <s className="text-xs text-muted-foreground">
            <span className="sr-only">Was </span>
            {product.compareAtPrice}
          </s>
        )}
        {product.discountLabel && (
          <span className="text-xs font-medium text-primary">
            {product.discountLabel}
          </span>
        )}
      </p>
    </article>
  );
}
