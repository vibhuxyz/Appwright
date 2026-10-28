import { CaseStudy } from "@/components/patterns/editorial/case-study";
import { ImageCollage } from "@/components/patterns/editorial/image-collage";
import { QuoteBand } from "@/components/patterns/editorial/quote-band";
import { PlaygroundHero } from "@/components/patterns/hero/playground-hero";
import { ClosingCta } from "@/components/patterns/layout/closing-cta";
import { EditorialFooter } from "@/components/patterns/layout/editorial-footer";

const WORK = ["Tide poster", "Kiln identity", "Field notes", "Orbit type", "Paper moon", "Night market"].map((label, index) => ({
  id: `work-${index + 1}`,
  label,
  image: { alt: `${label}, studio project` },
}));

export function StudioHome() {
  return (
    <main className="bg-background text-foreground">
      <PlaygroundHero
        eyebrow="Mono Studio, Lisbon"
        title="We make identities you want to pick up"
        intro="A small design studio for brands, books and exhibitions. Move the work around; it was made to be handled."
        items={WORK}
        action={{ label: "Start a project", href: "/contact" }}
      />
      <ImageCollage
        eyebrow="Studio"
        heading="Printed, cut, scanned, set"
        body="Every identity starts on the table before it reaches a screen."
        images={WORK.slice(0, 5).map((item) => ({ image: item.image, caption: item.label }))}
        isInteractive
        hasGrain
      />
      <CaseStudy
        eyebrow="Case study"
        title="Kiln: an identity fired in clay"
        cover={{ alt: "Kiln ceramics identity on glazed tiles" }}
        facts={[
          { label: "Client", value: "Kiln Ceramics" },
          { label: "Year", value: "2026" },
          { label: "Role", value: "Identity, packaging" },
        ]}
        chapters={[
          { title: "Challenge", body: "A ceramics shop that looked like every other shop online." },
          { title: "Approach", body: "We pressed the letters into clay and photographed every glaze." },
          { title: "Outcome", body: "An identity that changes with each firing, kept in one system." },
        ]}
        details={[{ alt: "Glazed letter tiles" }, { alt: "Kiln packaging" }]}
        next={{ label: "Field notes", href: "/work/field-notes" }}
      />
      <QuoteBand
        heading="Clients"
        quotes={[{ quote: "They understood the clay before they understood the brief.", name: "Ana Reis", role: "Founder, Kiln Ceramics" }]}
      />
      <ClosingCta
        heading="Have something to make"
        highlight="by hand?"
        body="We take on four projects a season."
        action={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "See all work", href: "/work" }}
        hasAmbient
      />
      <EditorialFooter
        brand="Mono"
        statement="Design for things people hold."
        columns={[{ title: "Studio", links: [{ label: "Work", href: "/work" }, { label: "Contact", href: "/contact" }] }]}
        legal="© 2026 Mono Studio"
      />
    </main>
  );
}
