import { describe, expect, test } from "bun:test";
import { withRequiredUiComponents } from "../src";

describe("withRequiredUiComponents", () => {
  test("adds Testimonials and Carousel to a public home page", () => {
    const [home] = withRequiredUiComponents([
      { route: "/", purpose: "Bakery home with hero photos", components: ["Hero"] },
    ]);
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
