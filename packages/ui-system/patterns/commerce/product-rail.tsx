"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import {
  ProductCard,
  type Product,
} from "@/components/patterns/commerce/product-card";
import { RailProgress } from "@/components/patterns/commerce/rail-progress";

const SCROLL_FRACTION = 0.85;
const MAX_RAIL_PRODUCTS = 12;

export interface ProductRailProps {
  heading: string;
  products: readonly Product[];
  viewAll?: { label: string; href: string };
}

export function ProductRail({ heading, products, viewAll }: ProductRailProps) {
  const railRef = useRef<HTMLUListElement>(null);
  const scrollByPage = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";
    rail.scrollBy({
      left: direction * rail.clientWidth * SCROLL_FRACTION,
      behavior,
    });
  };
  return (
    <section
      data-section="commerce.product-rail"
      className="bg-background py-16 text-foreground"
    >
      <div className="mx-auto flex max-w-screen-2xl items-end justify-between gap-4 px-4 md:px-8">
        <h2 className="font-heading text-2xl font-bold uppercase tracking-wide md:text-3xl">
          {heading}
        </h2>
        <div className="flex items-center gap-2">
          {viewAll && (
            <a
              href={viewAll.href}
              className="mr-2 inline-flex min-h-6 items-center text-sm font-medium underline-offset-4 hover:underline"
            >
              {viewAll.label}
            </a>
          )}
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => scrollByPage(-1)}
            className="hidden size-10 items-center justify-center rounded-full border border-border transition duration-150 ease-out hover:bg-muted motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-ring md:flex"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => scrollByPage(1)}
            className="hidden size-10 items-center justify-center rounded-full border border-border transition duration-150 ease-out hover:bg-muted motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-ring md:flex"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul
        ref={railRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 md:scroll-px-8 md:px-8"
        aria-label={heading}
      >
        {products.slice(0, MAX_RAIL_PRODUCTS).map((product) => (
          <li
            key={product.id}
            className="w-3/5 shrink-0 snap-start sm:w-2/5 md:w-1/4 lg:w-1/5"
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
      <RailProgress railRef={railRef} />
    </section>
  );
}
