import type { Entity, Page } from "@repo/contracts";
import type { ProjectTemplate } from "../types";

const CONTACT_ROUTE_PATTERN = /contact|store|about|location/;

const CONTACT_PAGE: Page = {
  route: "/contact",
  purpose: "Contact details, opening hours, map and social links",
  components: ["ContactDetails", "OpeningHours", "MapEmbed"],
};

const SITE_SETTINGS: Entity = {
  name: "SiteSettings",
  fields: [
    { name: "businessName", type: "String", required: true, unique: false },
    { name: "tagline", type: "String", required: false, unique: false },
    { name: "address", type: "String", required: false, unique: false },
    { name: "phone", type: "String", required: false, unique: false },
    { name: "email", type: "String", required: false, unique: false },
    { name: "openingHours", type: "Json", required: false, unique: false },
    { name: "socialLinks", type: "Json", required: false, unique: false },
  ],
  relations: [],
};

export const businessSiteTemplate: ProjectTemplate = (blueprint) => {
  const hasContactPage = blueprint.pages.some((page) => CONTACT_ROUTE_PATTERN.test(page.route));
  return {
    pages: hasContactPage ? [] : [CONTACT_PAGE],
    entities: [SITE_SETTINGS],
    features: [],
    acceptance: {
      admin: ["Admins edit the business details, opening hours, gallery and social links the pages show"],
      seo: ["LocalBusiness structured data uses the verified business details"],
      media: [
        "Each image a page section names has one slot. Do not add a product catalog, prices, or featured items unless a page purpose is a shop or menu.",
      ],
    },
  };
};
