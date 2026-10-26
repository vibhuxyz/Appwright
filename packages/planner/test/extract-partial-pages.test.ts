import { describe, expect, it } from "bun:test";
import { extractPartialPages } from "../src";

describe("extractPartialPages", () => {
  it("reads finished pages and the sections written so far", () => {
    const partial = '{"entities":[{"name":"Lead"}],"pages":[{"route":"/","purpose":"Home","components":["Hero","Services"]},{"route":"/booking","purpose":"Book","components":["BookingForm","Pay';
    expect(extractPartialPages(partial)).toEqual([
      { route: "/", components: ["Hero", "Services"] },
      { route: "/booking", components: ["BookingForm"] },
    ]);
  });

  it("returns nothing before the pages list starts", () => {
    expect(extractPartialPages('{"entities":[{"name":"Lead","route":"/x"}')).toEqual([]);
  });
});
