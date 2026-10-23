import type { ThemeFontName } from "@repo/contracts";

export type ArchetypeId =
  | "food"
  | "beauty-fashion"
  | "tech"
  | "health"
  | "creative"
  | "finance"
  | "education"
  | "commerce"
  | "travel-events"
  | "home-nature"
  | "general";

export interface FontPair {
  heading: ThemeFontName;
  body: ThemeFontName;
}

export interface Archetype {
  id: ArchetypeId;
  keywords: RegExp;
  hues: readonly [number, number, number];
  pairs: readonly [FontPair, FontPair, FontPair, FontPair, FontPair];
}

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "food",
    keywords: /\b(bakery|bake|cafe|coffee|restaurant|food|pizza|burger|catering|kitchen|menu|chef|dessert|cake|bread|pastry|bar|juice|tea)\b/i,
    hues: [28, 8, 95],
    pairs: [
      { heading: "Playfair Display", body: "Lato" },
      { heading: "Fraunces", body: "DM Sans" },
      { heading: "Oswald", body: "Work Sans" },
      { heading: "DM Serif Display", body: "Inter" },
      { heading: "Caveat", body: "Nunito" },
    ],
  },
  {
    id: "beauty-fashion",
    keywords: /\b(fashion|clothing|apparel|boutique|salon|spa|beauty|makeup|cosmetic|skincare|jewelry|jewellery|wedding dress|barber|nails)\b/i,
    hues: [340, 15, 290],
    pairs: [
      { heading: "Cormorant Garamond", body: "Montserrat" },
      { heading: "Playfair Display", body: "Poppins" },
      { heading: "Syne", body: "Inter" },
      { heading: "DM Serif Display", body: "Lato" },
      { heading: "Pacifico", body: "Nunito" },
    ],
  },
  {
    id: "tech",
    keywords: /\b(saas|software|startup|dashboard|developer|api|platform|app|ai|analytics|crm|tool|cloud|automation|devops|crypto|web3)\b/i,
    hues: [250, 200, 160],
    pairs: [
      { heading: "Space Grotesk", body: "Inter" },
      { heading: "Plus Jakarta Sans", body: "Inter" },
      { heading: "Manrope", body: "DM Sans" },
      { heading: "Outfit", body: "Work Sans" },
      { heading: "Syne", body: "Manrope" },
    ],
  },
  {
    id: "health",
    keywords: /\b(clinic|doctor|dental|dentist|health|medical|hospital|fitness|gym|yoga|wellness|therapy|pharmacy|nutrition|physio|care)\b/i,
    hues: [175, 205, 140],
    pairs: [
      { heading: "Nunito", body: "Nunito" },
      { heading: "DM Sans", body: "DM Sans" },
      { heading: "Poppins", body: "Lato" },
      { heading: "Lora", body: "Inter" },
      { heading: "Montserrat", body: "Lato" },
    ],
  },
  {
    id: "creative",
    keywords: /\b(portfolio|photography|photographer|designer|agency|studio|artist|art|gallery|film|music|band|creative|illustration|architect)\b/i,
    hues: [265, 20, 55],
    pairs: [
      { heading: "Syne", body: "Space Grotesk" },
      { heading: "Bebas Neue", body: "Work Sans" },
      { heading: "Fraunces", body: "Manrope" },
      { heading: "Space Grotesk", body: "Inter" },
      { heading: "Playfair Display", body: "DM Sans" },
    ],
  },
  {
    id: "finance",
    keywords: /\b(bank|finance|financial|invest|insurance|law|lawyer|legal|accounting|accountant|consulting|consultant|tax|wealth|mortgage|loan)\b/i,
    hues: [215, 160, 35],
    pairs: [
      { heading: "Merriweather", body: "Inter" },
      { heading: "Libre Baskerville", body: "Lato" },
      { heading: "Manrope", body: "Inter" },
      { heading: "Lora", body: "Work Sans" },
      { heading: "Plus Jakarta Sans", body: "DM Sans" },
    ],
  },
  {
    id: "education",
    keywords: /\b(school|course|courses|learn|learning|tutor|academy|university|education|kids|children|training|class|lms|student)\b/i,
    hues: [225, 45, 150],
    pairs: [
      { heading: "Poppins", body: "Nunito" },
      { heading: "Fraunces", body: "Inter" },
      { heading: "Montserrat", body: "Lato" },
      { heading: "Outfit", body: "DM Sans" },
      { heading: "Caveat", body: "Poppins" },
    ],
  },
  {
    id: "commerce",
    keywords: /\b(store|shop|ecommerce|e-commerce|marketplace|retail|products|checkout|cart|merch|wholesale)\b/i,
    hues: [260, 12, 175],
    pairs: [
      { heading: "DM Sans", body: "Inter" },
      { heading: "Poppins", body: "Inter" },
      { heading: "Bebas Neue", body: "Montserrat" },
      { heading: "Plus Jakarta Sans", body: "Work Sans" },
      { heading: "Playfair Display", body: "Lato" },
    ],
  },
  {
    id: "travel-events",
    keywords: /\b(travel|tour|tourism|hotel|resort|booking|trip|wedding|event|events|festival|conference|venue|airline|vacation)\b/i,
    hues: [195, 25, 330],
    pairs: [
      { heading: "Playfair Display", body: "Montserrat" },
      { heading: "Outfit", body: "Inter" },
      { heading: "Fraunces", body: "Work Sans" },
      { heading: "Oswald", body: "Lato" },
      { heading: "Pacifico", body: "DM Sans" },
    ],
  },
  {
    id: "home-nature",
    keywords: /\b(florist|flower|garden|plant|nursery|real estate|property|furniture|interior|home|eco|organic|farm|landscaping|construction|cleaning)\b/i,
    hues: [135, 85, 30],
    pairs: [
      { heading: "Lora", body: "Nunito" },
      { heading: "Fraunces", body: "DM Sans" },
      { heading: "Merriweather", body: "Lato" },
      { heading: "DM Serif Display", body: "Inter" },
      { heading: "Cormorant Garamond", body: "Montserrat" },
    ],
  },
  {
    id: "general",
    keywords: /$^/,
    hues: [240, 20, 160],
    pairs: [
      { heading: "Inter", body: "Inter" },
      { heading: "Playfair Display", body: "Lato" },
      { heading: "Space Grotesk", body: "DM Sans" },
      { heading: "Manrope", body: "Inter" },
      { heading: "Fraunces", body: "Inter" },
    ],
  },
];
