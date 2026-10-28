import type { Product } from "@/components/patterns/commerce/product-card";
import { CampaignBanner } from "@/components/patterns/commerce/campaign-banner";
import { FeaturedCollection } from "@/components/patterns/commerce/featured-collection";
import { ProductRail } from "@/components/patterns/commerce/product-rail";
import { PromoBar } from "@/components/patterns/commerce/promo-bar";
import { ScrollExpand } from "@/components/patterns/effects/scroll/scroll-expand";
import { ScrollShape } from "@/components/patterns/effects/scroll/scroll-shape";
import { CinematicHero } from "@/components/patterns/hero/cinematic-hero";
import { EditorialFooter } from "@/components/patterns/layout/editorial-footer";
import { FaqStack } from "@/components/patterns/layout/faq-stack";
import { Media } from "@/components/patterns/shared/media";
import { ON_IMAGE_SCRIM_CLASS, ON_IMAGE_TEXT_CLASS } from "@/components/patterns/shared/on-image";

const PRODUCTS: Product[] = Array.from({ length: 6 }, (_unused, index) => ({
  id: `trail-${index + 1}`,
  href: `/shop/trail-${index + 1}`,
  brand: "Stride",
  name: `Ridge Trail ${index + 1}`,
  image: { alt: `Ridge Trail ${index + 1} shoe, side view` },
  price: "₹6,499",
}));

export function CampaignHome() {
  return (
    <main className="bg-background text-foreground">
      <PromoBar message="Free returns for 30 days" href="/returns" />
      <ScrollShape shape="slant" className="h-svh">
        <CinematicHero
          image={{ alt: "Runner on a ridge at dawn", focalPoint: { x: 40, y: 60 } }}
          title="Run the ridge"
          subtitle="The Ridge Trail collection"
          actions={[{ label: "Shop trail", href: "/shop/trail" }]}
        />
      </ScrollShape>
      <ProductRail heading="New for the trail" products={PRODUCTS} viewAll={{ label: "View all", href: "/shop/trail" }} />
      <FeaturedCollection
        eyebrow="Collection"
        heading="Built for wet rock"
        intro="Grip compound tested on Sintra granite in the rain."
        image={{ alt: "Close-up of a shoe sole on wet granite" }}
        link={{ label: "Shop the collection", href: "/shop/wet-rock" }}
        products={PRODUCTS.slice(0, 4)}
      />
      <ScrollExpand
        overlay={
          <div className={`pointer-events-none absolute inset-0 flex items-end ${ON_IMAGE_SCRIM_CLASS}`}>
            <p className={`mx-auto w-full max-w-screen-2xl px-4 pb-16 font-heading text-5xl font-bold uppercase leading-none md:px-8 md:text-8xl ${ON_IMAGE_TEXT_CLASS}`}>Made on the mountain</p>
          </div>
        }
      >
        <Media image={{ alt: "Trail runners crossing a ridge in fog" }} fill sizes="100vw" />
      </ScrollExpand>
      <CampaignBanner
        eyebrow="Story"
        title="Three runners, one ridge"
        image={{ alt: "Three runners on a ridge line" }}
        action={{ label: "Watch the film", href: "/stories/ridge" }}
      />
      <FaqStack
        heading="Trail questions"
        items={[
          { question: "How do Ridge Trail shoes fit?", answer: "True to size with room for thick socks." },
          { question: "Can I return worn shoes?", answer: "Yes, within 30 days if you ran on a treadmill." },
        ]}
      />
      <EditorialFooter
        brand="Stride"
        statement="Shoes for the places roads stop."
        columns={[{ title: "Shop", links: [{ label: "Trail", href: "/shop/trail" }, { label: "Returns", href: "/returns" }] }]}
        legal="© 2026 Stride"
      />
    </main>
  );
}
