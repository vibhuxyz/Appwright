import type { SiteBrief } from "./types";

export const SITE_BRIEFS: readonly SiteBrief[] = [
  {
    id: "fashion",
    prompt:
      "Build a website for Maison Odile, an independent womenswear label from Lisbon making small-batch linen and silk pieces. Pages: home with a lookbook feel, the current collection, the atelier story, and a contact page with the studio email and address. Tone: quiet, editorial, confident.",
  },
  {
    id: "saas",
    prompt:
      "Build a marketing landing website for Tallyfox, invoicing automation software for freelancers: it chases late invoices, matches bank transfers and sends tax-ready summaries. Pages: home, features, pricing with three plan cards, and contact with a sales email. Tone: clear, trustworthy, a little playful.",
  },
  {
    id: "portfolio",
    prompt:
      "Build a landing website for Mira Okonkwo, an architectural and interiors photographer based in Lagos, showing her selected work. Pages: home with featured projects, a work page with project sections, about, and contact with her email and studio address. Tone: restrained and image-led, letting the pictures lead.",
  },
  {
    id: "local-business",
    prompt:
      "Build a website for Harbor & Rye, a neighbourhood bakery and cafe in Portland, Maine serving sourdough, pastries and lunch. Pages: home, the menu, visit us with opening hours and the address, and contact with phone and email. Tone: warm, welcoming, down to earth.",
  },
];
