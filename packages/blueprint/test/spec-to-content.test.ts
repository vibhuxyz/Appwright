import { describe, expect, it } from "bun:test";
import type { ProjectSpecification } from "@repo/contracts";
import { specificationToBlueprintContent } from "../src/spec-to-content";

describe("specificationToBlueprintContent", () => {
  const sampleSpec: ProjectSpecification = {
    version: 1,
    projectIntent: {
      summary: "Modern interior design portfolio and booking platform",
      productType: "web_app",
      targetUsers: ["Homeowners", "Interior designers"],
      primaryGoals: ["Showcase projects", "Book consultations"],
      successCriteria: ["Smooth booking flow"],
    },
    requirements: {
      functional: [
        "Display past interior design projects with high-res photos",
        "Enable user authentication and login",
      ],
      nonFunctional: ["Fast image loading", "Responsive design"],
      businessRules: ["Booking requires user account"],
      constraints: ["Use Tailwind CSS"],
      acceptanceCriteria: ["User can browse gallery and schedule appointment"],
    },
    pages: [
      {
        name: "Home",
        route: "/",
        purpose: "Hero section, featured designs, client testimonials",
        sections: [],
        requiredComponents: ["HeroBanner", "FeaturedProjects", "TestimonialSlider"],
        sourceReferences: ["image_1"],
      },
      {
        name: "Book Consultation",
        route: "/consultation",
        purpose: "Appointment booking form with date picker",
        sections: [],
        requiredComponents: ["ConsultationForm", "DatePicker"],
        sourceReferences: ["pdf_doc"],
      },
    ],
    designSystem: {
      visualDirection: "modern-minimal",
      colors: [
        { role: "primary", hex: "#1A365D", name: "Deep Navy" },
        { role: "secondary", hex: "#2B6CB0", name: "Soft Blue" },
      ],
      typography: [
        { role: "heading", font: "Playfair Display" },
        { role: "body", font: "Inter" },
      ],
      spacingGuidance: ["Spacious layout"],
      componentGuidance: ["Rounded cards"],
      responsiveRequirements: ["Mobile-first layout"],
    },
    dataModel: [
      {
        entity: "Project",
        fields: [
          { name: "title", type: "String", required: true, unique: false },
          { name: "description", type: "String", required: false, unique: false },
          { name: "imageUrl", type: "String", required: true, unique: false },
        ],
        relations: [],
        sourceReferences: ["image_1"],
      },
    ],
    integrations: [
      {
        name: "stripe",
        purpose: "Payment processing for consultations",
        required: true,
        sourceReferences: ["pdf_doc"],
      },
    ],
    implementationConstraints: ["Use Tailwind CSS"],
    ambiguities: [],
    assumptions: ["Standard timezone handling"],
    sourceEvidence: [
      {
        sourceId: "att_1",
        sourceName: "wireframe.png",
        type: "image_reference",
        role: "Visual layout inspiration",
        description: "Editorial gallery with large hero",
        confidence: 0.95,
      },
    ],
    confidence: 0.95,
  };

  it("converts ProjectSpecification to BlueprintContent with pages and entities", () => {
    const content = specificationToBlueprintContent(sampleSpec);

    expect(content.entities.length).toBe(1);
    expect(content.entities[0]?.name).toBe("Project");
    expect(content.pages.length).toBe(2);
    expect(content.pages[0]?.route).toBe("/");
    expect(content.pages[1]?.route).toBe("/consultation");
    expect(content.features).toContain("auth");
    expect(content.features).toContain("payments");
    expect(content.theme.primary).toBe("#1A365D");
    expect(content.theme.preset).toBe("modern-minimal");
  });
});
