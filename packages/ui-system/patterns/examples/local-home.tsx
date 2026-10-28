import { SplitStory } from "@/components/patterns/editorial/split-story";
import { CinematicHero } from "@/components/patterns/hero/cinematic-hero";
import { BentoGrid } from "@/components/patterns/layout/bento-grid";
import { EditorialFooter } from "@/components/patterns/layout/editorial-footer";

export function LocalHome() {
  return (
    <main className="bg-background text-foreground">
      <CinematicHero
        image={{ alt: "Fresh sourdough loaves on the bakery counter" }}
        title="Baked before sunrise"
        subtitle="Open daily from 7am in Indiranagar"
        actions={[
          { label: "See the menu", href: "/menu" },
          { label: "Call us", href: "tel:+910000000000" },
        ]}
      />
      <SplitStory
        eyebrow="Our bakery"
        title="Three ovens, one neighbourhood"
        body="We bake small batches through the morning so the bread on the shelf is never more than a few hours old."
        image={{ alt: "Baker shaping dough" }}
        stats={[
          { value: 12, label: "Breads daily" },
          { value: 7, suffix: "am", label: "Doors open" },
        ]}
      />
      <BentoGrid
        heading="What to order"
        items={[
          {
            title: "Country sourdough",
            body: "48-hour ferment, crackling crust.",
            size: "large",
            image: { alt: "Sourdough loaf cut open" },
          },
          {
            title: "Cardamom buns",
            body: "Our weekend favourite.",
            size: "small",
          },
          {
            title: "Filter coffee",
            body: "Roasted in Chikmagalur.",
            size: "small",
          },
          {
            title: "Celebration cakes",
            body: "Order two days ahead.",
            size: "wide",
          },
        ]}
      />
      <EditorialFooter
        brand="Crumb"
        statement="12th Main Road, Indiranagar, Bengaluru. Open 7am to 9pm, every day."
        columns={[
          {
            title: "Visit",
            links: [
              { label: "Directions", href: "/contact" },
              { label: "Menu", href: "/menu" },
            ],
          },
        ]}
        legal="© 2026 Crumb Bakery"
      />
    </main>
  );
}
