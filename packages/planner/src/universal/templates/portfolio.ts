import type { Entity, Page } from "@repo/contracts";
import type { ProjectTemplate } from "../types";

const CONTACT_ROUTE_PATTERN = /contact/;

const CONTACT_PAGE: Page = {
  route: "/contact",
  purpose: "Contact form with validation and clear success and error feedback",
  components: ["ContactForm"],
};

const CONTACT_MESSAGE: Entity = {
  name: "ContactMessage",
  fields: [
    { name: "name", type: "String", required: true, unique: false },
    { name: "email", type: "String", required: true, unique: false },
    { name: "message", type: "String", required: true, unique: false },
    { name: "createdAt", type: "DateTime", required: true, unique: false },
  ],
  relations: [],
};

export const portfolioTemplate: ProjectTemplate = (blueprint) => {
  const hasContactPage = blueprint.pages.some((page) => CONTACT_ROUTE_PATTERN.test(page.route));
  return {
    pages: hasContactPage ? [] : [CONTACT_PAGE],
    entities: [CONTACT_MESSAGE],
    features: [],
    acceptance: {
      security: ["The contact form is rate limited and rejects spam and oversized input"],
      seo: ["Each project page has Open Graph metadata with its cover image"],
      media: ["Each project has a cover image slot and optional gallery slots"],
    },
  };
};
