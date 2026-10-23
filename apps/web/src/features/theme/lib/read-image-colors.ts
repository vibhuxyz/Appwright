import { MAX_REFERENCE_COLORS } from "@repo/contracts";
import { dominantColors } from "./dominant-colors";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SAMPLE_EDGE_PX = 64;

export async function readImageColors(file: File): Promise<string[]> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image. Upload a PNG, JPG, WebP or GIF.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than 8 MB. Choose a smaller image.`);
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_EDGE_PX;
    canvas.height = SAMPLE_EDGE_PX;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser cannot read image colours.");
    context.drawImage(bitmap, 0, 0, SAMPLE_EDGE_PX, SAMPLE_EDGE_PX);
    const { data } = context.getImageData(0, 0, SAMPLE_EDGE_PX, SAMPLE_EDGE_PX);
    const colors = dominantColors(data, MAX_REFERENCE_COLORS);
    if (colors.length === 0) throw new Error(`No usable colours found in ${file.name}.`);
    return colors;
  } finally {
    bitmap.close();
  }
}
