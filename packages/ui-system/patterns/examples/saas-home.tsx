import { Gauge, Plug, ShieldCheck, Workflow } from "lucide-react";
import { Manifesto } from "@/components/patterns/editorial/manifesto";
import { StickyStory } from "@/components/patterns/editorial/sticky-story";
import { SpotlightHero } from "@/components/patterns/hero/spotlight-hero";
import { BentoGrid } from "@/components/patterns/layout/bento-grid";

export function SaasHome() {
  return (
    <main className="bg-background text-foreground">
      <SpotlightHero
        eyebrow="Now with workflow automation"
        titleStart="The CRM built for"
        rotatingWords={["founders", "sales teams", "agencies"]}
        description="Track every deal, automate follow-ups and see your pipeline in one fast workspace."
        primaryAction={{ label: "Start free", href: "/signup" }}
        secondaryAction={{ label: "See pricing", href: "/pricing" }}
      />
      <BentoGrid
        eyebrow="Features"
        heading="Everything your pipeline needs, nothing it does not"
        items={[
          {
            title: "Pipeline view",
            body: "Drag deals between stages and see value at a glance.",
            size: "large",
            image: { alt: "Pipeline board screenshot" },
          },
          {
            title: "Automations",
            body: "Send follow-ups when a deal goes quiet.",
            size: "small",
            icon: <Workflow className="size-6" />,
          },
          {
            title: "Integrations",
            body: "Gmail, Slack and Stripe in two clicks.",
            size: "small",
            icon: <Plug className="size-6" />,
          },
          {
            title: "Forecasts",
            body: "Weighted revenue by month and by rep.",
            size: "wide",
            icon: <Gauge className="size-6" />,
          },
          {
            title: "Permissions",
            body: "Roles for sales, finance and admins.",
            size: "small",
            icon: <ShieldCheck className="size-6" />,
          },
        ]}
      />
      <StickyStory
        eyebrow="How it works"
        heading="From first email to signed deal"
        steps={[
          {
            title: "Capture",
            body: "Leads arrive from forms and email automatically.",
            image: { alt: "Inbox capture screenshot" },
          },
          {
            title: "Qualify",
            body: "Score leads with the fields that matter to you.",
            image: { alt: "Lead scoring screenshot" },
          },
          {
            title: "Close",
            body: "Send the quote and get notified when it is signed.",
            image: { alt: "Signed quote screenshot" },
          },
        ]}
      />
      <Manifesto statement="Software for selling should feel as fast as the people using it." />
    </main>
  );
}
