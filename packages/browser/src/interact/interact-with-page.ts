import { join } from "node:path";
import { screenshotName, type Viewport } from "../findings";
import type { BrowserSession } from "../session";
import { testClicks } from "./test-clicks";
import { testForms } from "./test-forms";
import { mergeInteractionResults, type InteractContext, type InteractionResult } from "./types";

export interface InteractOptions {
  readonly baseUrl: string;
  readonly route: string;
  readonly viewport: Viewport;
  readonly outputDir: string;
}

export async function interactWithPage(
  session: BrowserSession,
  options: InteractOptions,
): Promise<InteractionResult> {
  const { baseUrl, route, viewport, outputDir } = options;
  const page = await session.openPage(viewport);
  try {
    const context: InteractContext = {
      page,
      route,
      url: new URL(route, baseUrl).toString(),
      viewport: viewport.name,
      capture: async (suffix) => {
        const name = screenshotName(route, viewport, suffix);
        await page.screenshot(join(outputDir, name));
        return name;
      },
    };
    await page.navigate(context.url);
    const forms = await testForms(context);
    const clicks = await testClicks(context);
    return mergeInteractionResults([forms, clicks]);
  } finally {
    await page.close();
  }
}
