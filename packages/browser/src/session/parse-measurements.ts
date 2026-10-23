import { z } from "zod";
import type { PageMeasurements } from "./types";

const MeasurementsSchema = z.object({
  viewportWidth: z.number(),
  scrollWidth: z.number(),
  bodyTextLength: z.number(),
  overflowing: z.array(z.string()),
  brokenImages: z.array(z.string()),
  unlabelledControls: z.array(z.string()),
  links: z.array(z.string()),
});

export function parseMeasurements(raw: unknown): PageMeasurements {
  return MeasurementsSchema.parse(raw);
}
