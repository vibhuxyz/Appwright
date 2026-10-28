import { EditorialGallery } from "@/components/patterns/editorial/editorial-gallery";
import { Manifesto } from "@/components/patterns/editorial/manifesto";
import { SplitStory } from "@/components/patterns/editorial/split-story";
import { EditorialHero } from "@/components/patterns/hero/editorial-hero";
import { EditorialFooter } from "@/components/patterns/layout/editorial-footer";
import { OverlayNav } from "@/components/patterns/layout/overlay-nav";

const PROJECTS = [
  "Mall of the Emirates",
  "Bestseller 50 Festival",
  "Copenhagen Fashion Week",
  "Rains",
  "Ganni",
  "Arket",
].map((title) => ({
  title,
  caption: "Art direction",
  href: `/work/${title.toLowerCase().replaceAll(" ", "-")}`,
  image: { alt: `${title} campaign image` },
}));

export function PortfolioHome() {
  return (
    <main className="bg-background text-foreground">
      <OverlayNav
        brand="Brandon Yasin"
        meta="Creative direction, Copenhagen"
        contact={{ label: "Contact", href: "/contact" }}
        links={[
          { label: "Work", href: "/work" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ]}
      />
      <EditorialHero
        eyebrow="Creative director"
        title="Campaigns for brands that move culture"
        intro="Art direction, digital design and identity for fashion and lifestyle brands across Europe and the Gulf."
        image={{ alt: "Model in a black dress against a white wall" }}
        action={{ label: "Selected work", href: "/work" }}
        meta={[
          { label: "Based in", value: "Copenhagen" },
          { label: "Since", value: "2014" },
          { label: "Focus", value: "Fashion" },
          { label: "Status", value: "Booking 2027" },
        ]}
      />
      <EditorialGallery
        heading="Selected work"
        items={PROJECTS}
        layout="rail"
      />
      <Manifesto
        eyebrow="Approach"
        statement="Every brand already has a voice. The work is to find the one image that makes people hear it, and then to repeat it with discipline."
      />
      <EditorialGallery
        heading="Archive"
        items={PROJECTS.slice(0, 4)}
        layout="staggered"
      />
      <SplitStory
        eyebrow="About"
        title="Ten years of campaigns"
        body="Working between Copenhagen and Dubai with a small team of photographers and developers."
        image={{ alt: "Studio with prints on the wall" }}
        imageSide="left"
      />
      <EditorialFooter
        brand="BY."
        statement="Available for campaigns and identities from spring 2027."
        columns={[
          {
            title: "Elsewhere",
            links: [{ label: "Instagram", href: "/instagram" }],
          },
        ]}
        legal="© 2026 Brandon Yasin"
      />
    </main>
  );
}
