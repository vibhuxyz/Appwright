import { PromoBar } from "@/components/patterns/commerce/promo-bar";
import { ProductGrid } from "@/components/patterns/commerce/product-grid";
import { ProductRail } from "@/components/patterns/commerce/product-rail";
import type { Product } from "@/components/patterns/commerce/product-card";
import { MarqueeBand } from "@/components/patterns/editorial/marquee-band";
import { StickyStory } from "@/components/patterns/editorial/sticky-story";
import { CinematicHero } from "@/components/patterns/hero/cinematic-hero";
import { EditorialFooter } from "@/components/patterns/layout/editorial-footer";

const PRODUCTS: Product[] = Array.from({ length: 8 }, (_unused, index) => ({
  id: `sneaker-${index + 1}`,
  href: `/shop/sneaker-${index + 1}`,
  brand: "Stride",
  name: `Court Runner ${index + 1} low-top sneaker`,
  image: { alt: `Court Runner ${index + 1} sneaker, side view` },
  price: "₹2,799",
  compareAtPrice: "₹4,999",
  discountLabel: "44% off",
  rating: "4.4",
  ratingCount: "1.2k",
  ...(index === 0 ? { badge: "New" } : {}),
}));

export function FashionHome() {
  return (
    <main className="bg-background text-foreground">
      <PromoBar message="Extra 5% off on online payments" href="/offers" />
      <CinematicHero
        image={{ alt: "Two friends in winter jackets at an ice rink" }}
        title="Change of pace"
        subtitle="Gear up for the new season"
        actions={[
          { label: "For him", href: "/men" },
          { label: "For her", href: "/women" },
          { label: "Shop winterwear", href: "/winter" },
        ]}
      />
      <ProductRail
        heading="Trending in spotlight"
        products={PRODUCTS}
        viewAll={{ label: "View all", href: "/shop" }}
      />
      <MarqueeBand
        label="Collections"
        words={["Running", "Lifestyle", "Motorsport", "Training"]}
      />
      <StickyStory
        eyebrow="03. Collection overview"
        heading="The level of insulation, from light to winter-ready."
        steps={[
          {
            title: "T1 Shell",
            body: "A light layer that blocks wind and drizzle.",
            image: { alt: "Beige shell jacket" },
          },
          {
            title: "T2 Puffer",
            body: "Recycled fill for cold mornings.",
            image: { alt: "Silver puffer jacket" },
          },
          {
            title: "T3 Parka",
            body: "Full insulation for real winter.",
            image: { alt: "Navy parka" },
          },
        ]}
      />
      <ProductGrid
        heading="Casual shoes"
        countLabel="8 items"
        products={PRODUCTS}
      />
      <EditorialFooter
        brand="Stride"
        statement="Sportswear made to move with you, from the track to the street."
        columns={[
          {
            title: "Shop",
            links: [
              { label: "Men", href: "/men" },
              { label: "Women", href: "/women" },
            ],
          },
          {
            title: "Help",
            links: [
              { label: "Shipping", href: "/shipping" },
              { label: "Returns", href: "/returns" },
            ],
          },
        ]}
        legal="© 2026 Stride"
      />
    </main>
  );
}
