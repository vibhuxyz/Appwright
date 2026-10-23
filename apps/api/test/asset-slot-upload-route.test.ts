import { describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { assetSlotPath } from "../../web/src/features/assets/api/asset-slot-path";

describe("asset slot upload route", () => {
  it("matches a home-page slot id that contains a slash", async () => {
    const app = express();
    app.post("/asset-requests/:id/slots/:slotId/upload", (req, res) => {
      res.json({ slotId: req.params.slotId });
    });
    const server = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, () => resolve(listening));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("no port");
    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}${assetSlotPath("req-1", "/:Hero:0", "upload")}`,
        { method: "POST" },
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ slotId: "/:Hero:0" });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
