export const THEME_FONTS = {
  Inter: { weights: "400;500;600;700", category: "sans-serif" },
  "DM Sans": { weights: "400;500;600;700", category: "sans-serif" },
  Manrope: { weights: "400;500;600;700", category: "sans-serif" },
  Poppins: { weights: "400;500;600;700", category: "sans-serif" },
  Montserrat: { weights: "400;500;600;700", category: "sans-serif" },
  Nunito: { weights: "400;600;700", category: "sans-serif" },
  "Work Sans": { weights: "400;500;600;700", category: "sans-serif" },
  "Plus Jakarta Sans": { weights: "400;500;600;700", category: "sans-serif" },
  Outfit: { weights: "400;500;600;700", category: "sans-serif" },
  Lato: { weights: "400;700", category: "sans-serif" },
  "Space Grotesk": { weights: "400;500;700", category: "sans-serif" },
  Syne: { weights: "400;600;700", category: "sans-serif" },
  Oswald: { weights: "400;500;600;700", category: "sans-serif" },
  "Bebas Neue": { weights: "400", category: "sans-serif" },
  "Playfair Display": { weights: "400;600;700", category: "serif" },
  Lora: { weights: "400;500;600;700", category: "serif" },
  Merriweather: { weights: "400;700", category: "serif" },
  "Cormorant Garamond": { weights: "400;500;600;700", category: "serif" },
  "DM Serif Display": { weights: "400", category: "serif" },
  Fraunces: { weights: "400;600;700", category: "serif" },
  "Libre Baskerville": { weights: "400;700", category: "serif" },
  Caveat: { weights: "400;600;700", category: "cursive" },
  Pacifico: { weights: "400", category: "cursive" },
} as const;

export type ThemeFontName = keyof typeof THEME_FONTS;

export const THEME_FONT_NAMES = Object.keys(THEME_FONTS) as [ThemeFontName, ...ThemeFontName[]];

const GOOGLE_FONTS_ORIGIN = "https://fonts.googleapis.com/css2";

function familyParam(name: ThemeFontName): string {
  return `family=${name.replaceAll(" ", "+")}:wght@${THEME_FONTS[name].weights}`;
}

export function googleFontsUrl(fonts: readonly ThemeFontName[]): string {
  const unique = [...new Set(fonts)];
  return `${GOOGLE_FONTS_ORIGIN}?${unique.map(familyParam).join("&")}&display=swap`;
}

export function fontStack(name: ThemeFontName): string {
  return `"${name}", ${THEME_FONTS[name].category}`;
}
