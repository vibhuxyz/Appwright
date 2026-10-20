import { describe, expect, it } from "bun:test";
import { buildComponentGraph, updateComponentGraph } from "../src";

describe("buildComponentGraph and updateComponentGraph from AST", () => {
  const file1 = {
    path: "src/components/Card.tsx",
    content: `
      import React from "react";
      export function CardHeader({ title }: { title: string }) {
        return <h3 className="font-bold">{title}</h3>;
      }
      export default function Card({ title }: { title: string }) {
        return (
          <div className="border p-4">
            <CardHeader title={title} />
          </div>
        );
      }
    `,
  };

  const file2 = {
    path: "src/components/Dashboard.tsx",
    content: `
      import React from "react";
      import Card from "./Card";
      export function Dashboard() {
        return (
          <main>
            <Card title="Metrics" />
          </main>
        );
      }
    `,
  };

  it("extracts component nodes and usage edges from TSX AST", () => {
    const graph = buildComponentGraph([file1, file2]);
    expect(graph.nodes["Card"]).toBeDefined();
    expect(graph.nodes["CardHeader"]).toBeDefined();
    expect(graph.nodes["Dashboard"]).toBeDefined();

    expect(graph.nodes["Card"]?.isDefaultExport).toBe(true);
    expect(graph.nodes["CardHeader"]?.isNamedExport).toBe(true);

    const cardToHeader = graph.edges.find((e) => e.from === "Card" && e.to === "CardHeader");
    expect(cardToHeader).toBeDefined();
    expect(cardToHeader?.usageCount).toBe(1);

    const dashToCard = graph.edges.find((e) => e.from === "Dashboard" && e.to === "Card");
    expect(dashToCard).toBeDefined();
  });

  it("updates graph incrementally when a file changes", () => {
    const initialGraph = buildComponentGraph([file1, file2]);
    const updatedFile2 = {
      path: "src/components/Dashboard.tsx",
      content: `
        export function Dashboard() {
          return <div className="p-2">Empty</div>;
        }
      `,
    };

    const updatedGraph = updateComponentGraph(initialGraph, [updatedFile2]);
    expect(updatedGraph.nodes["Dashboard"]).toBeDefined();
    const dashToCard = updatedGraph.edges.find((e) => e.from === "Dashboard" && e.to === "Card");
    expect(dashToCard).toBeUndefined();
    expect(updatedGraph.nodes["Card"]).toBeDefined();
  });
});
