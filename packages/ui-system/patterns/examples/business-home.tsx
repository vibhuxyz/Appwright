import { SplitStory } from "@/components/patterns/editorial/split-story";
import { StickyStory } from "@/components/patterns/editorial/sticky-story";
import { EditorialHero } from "@/components/patterns/hero/editorial-hero";
import { BentoGrid } from "@/components/patterns/layout/bento-grid";
import { EditorialFooter } from "@/components/patterns/layout/editorial-footer";

export function BusinessHome() {
  return (
    <main className="bg-background text-foreground">
      <EditorialHero
        eyebrow="Chartered accountants"
        title="Clear books for growing Indian companies"
        intro="Audit, GST, payroll and advisory for startups and family businesses, from incorporation to Series B."
        image={{ alt: "Partners reviewing documents in the office" }}
        action={{ label: "Book a consultation", href: "/contact" }}
        meta={[
          { label: "Clients", value: "340 companies" },
          { label: "Offices", value: "Mumbai, Pune" },
          { label: "Founded", value: "1998" },
          { label: "Partners", value: "6" },
        ]}
      />
      <BentoGrid
        eyebrow="Services"
        heading="One firm for every filing and every question"
        items={[
          {
            title: "Statutory audit",
            body: "Ind AS audits with partner review on every file.",
            size: "wide",
          },
          {
            title: "GST",
            body: "Monthly returns, reconciliations and notices.",
            size: "small",
          },
          {
            title: "Payroll",
            body: "Salaries, PF, ESI and TDS on one calendar.",
            size: "small",
          },
          {
            title: "Startup advisory",
            body: "Cap tables, ESOPs and due diligence for funding rounds.",
            size: "large",
          },
          {
            title: "Tax planning",
            body: "Corporate and promoter tax, planned a year ahead.",
            size: "tall",
          },
        ]}
      />
      <StickyStory
        eyebrow="Onboarding"
        heading="How we take over your books"
        steps={[
          {
            title: "Review",
            body: "We read the last two years of filings and flag gaps.",
            image: { alt: "Accountant reading a ledger" },
          },
          {
            title: "Plan",
            body: "A calendar of every filing for the next twelve months.",
            image: { alt: "Compliance calendar on a desk" },
          },
          {
            title: "Run",
            body: "A named manager and a monthly report.",
            image: { alt: "Monthly report on a laptop" },
          },
        ]}
      />
      <SplitStory
        eyebrow="Firm"
        title="Twenty-eight years, same partners"
        body="Every client works with a partner, not only a junior team."
        image={{ alt: "Office reception" }}
        stats={[
          { value: 340, label: "Clients" },
          { value: 28, label: "Years" },
        ]}
      />
      <EditorialFooter
        brand="Mehta & Rao"
        statement="Nariman Point, Mumbai · Baner, Pune"
        columns={[
          {
            title: "Firm",
            links: [
              { label: "Services", href: "/services" },
              { label: "Contact", href: "/contact" },
            ],
          },
        ]}
        legal="© 2026 Mehta & Rao LLP"
      />
    </main>
  );
}
