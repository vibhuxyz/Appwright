import { describe, expect, test } from "bun:test";
import { withRequiredUiComponents } from "../src";

describe("withRequiredUiComponents", () => {
  test("adds a carousel to a public home page and skips reviews that were not requested", () => {
    const [home] = withRequiredUiComponents([
      { route: "/", purpose: "Bakery home with hero photos", components: ["Hero", "Testimonials"] },
    ]);
    expect(home?.components).toEqual(expect.arrayContaining(["Hero", "Carousel"]));
    expect(home?.components).not.toContain("Testimonials");
  });

  test("keeps testimonials when the request asks for reviews", () => {
    const [home] = withRequiredUiComponents(
      [{ route: "/", purpose: "Studio home", components: ["Hero"] }],
      "Include customer reviews on the home page",
    );
    expect(home?.components).toEqual(expect.arrayContaining(["Hero", "Testimonials", "Carousel"]));
  });

  test("adds Modal to public form pages", () => {
    const [order] = withRequiredUiComponents([
      { route: "/order", purpose: "Place a pickup order", components: ["OrderForm"] },
    ]);
    expect(order?.components).toEqual(expect.arrayContaining(["OrderForm", "Modal"]));
  });

  test("leaves admin pages unchanged", () => {
    const [admin] = withRequiredUiComponents([
      { route: "/admin", purpose: "Ops dashboard", components: ["PendingOrders"] },
    ]);
    expect(admin?.components).toEqual(["PendingOrders"]);
  });
});
