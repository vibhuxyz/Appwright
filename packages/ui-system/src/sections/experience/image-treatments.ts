import type { ArtDirection } from "../registry";
import type { ImageTreatment } from "./types";

type Preset = Omit<ImageTreatment, "role">;

const STILL: Preset = { entrance: "none", hover: "none", scroll: "static" };

const PRESETS: Readonly<Record<ArtDirection, Readonly<Record<string, Preset>>>> = {
  commerce: {
    hero: { entrance: "mask", hover: "none", scroll: "static" },
    banner: { entrance: "wipe", hover: "zoom", scroll: "static" },
    product: { entrance: "none", hover: "zoom", scroll: "static" },
    photo: { entrance: "wipe", hover: "none", scroll: "parallax" },
  },
  editorial: {
    hero: { entrance: "mask", hover: "none", scroll: "static" },
    gallery: { entrance: "wipe", hover: "grayscale", scroll: "static" },
    photo: { entrance: "wipe", hover: "none", scroll: "parallax" },
  },
  product: {
    hero: { entrance: "fade", hover: "none", scroll: "static" },
    photo: { entrance: "fade", hover: "none", scroll: "static" },
  },
  local: {
    hero: { entrance: "fade", hover: "none", scroll: "static" },
    gallery: { entrance: "fade", hover: "zoom", scroll: "static" },
    photo: { entrance: "fade", hover: "none", scroll: "static" },
  },
  classic: {
    hero: { entrance: "fade", hover: "none", scroll: "static" },
  },
};

export function imageTreatmentFor(role: string, direction: ArtDirection): ImageTreatment {
  return { role, ...(PRESETS[direction][role] ?? STILL) };
}
