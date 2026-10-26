import type { Attachment } from "@repo/contracts";
import { escapePromptXml, sanitizeUntrustedAttachmentText } from "./prompt-sanitizer";

const MAX_EXTRACTED_CHARS_PER_DOC = 12000;

export function buildMultimodalAnalysisPrompt(
  prompt: string,
  attachments: readonly Attachment[] = [],
): string {
  const parts: string[] = [
    `You are an expert system architect and visual designer analyzing a user request with attachments.`,
    `Analyze the user prompt and all attached references (images and PDF documents) to produce a unified ProjectSpecification JSON.`,
    ``,
    `Conflict Resolution Order:`,
    `1. Explicit user prompt instructions always take first precedence.`,
    `2. Clearly stated requirements in attached documents take second precedence.`,
    `3. Visual design details inferred from reference images take third precedence.`,
    `4. Sensible implementation defaults apply for any unspecified aspects.`,
    ``,
    `Visual Reference Guidelines (Lovable/Bolt style):`,
    `- Deconstruct visual hierarchy: layout flow, navbar, hero, bento grids, cards, modals, tables, footer.`,
    `- Color palette: identify primary brand hex color, background surface tones, borders, and badge colors.`,
    `- Component decomposition: identify distinct reusable UI elements with Tailwind classes and Lucide icons.`,
    `- Legible text & labels: preserve visible wording, headings, button labels, and menu items seen in references.`,
    ``,
    `Document Analysis Guidelines:`,
    `- Extract functional requirements, domain data entities, fields, business rules, and acceptance criteria.`,
    `- Note constraints, third-party integrations, and target audience.`,
    ``,
    `<user-prompt>`,
    escapePromptXml(prompt),
    `</user-prompt>`,
  ];

  if (attachments.length > 0) {
    parts.push(``, `<attachments-manifest>`);
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att) continue;
      parts.push(`Attachment #${i + 1}: ${att.name} (type: ${att.type}, mime: ${att.mimeType})`);
      if (att.description) parts.push(`  Description: ${att.description}`);
      if (att.extractedText) {
        const textSnippet = sanitizeUntrustedAttachmentText(
          att.extractedText.slice(0, MAX_EXTRACTED_CHARS_PER_DOC),
        );
        parts.push(`  Extracted Content:\n<attachment-content index="${i + 1}" name="${att.name}">\n${textSnippet}\n</attachment-content>`);
      }
    }
    parts.push(`</attachments-manifest>`);
  }

  parts.push(
    ``,
    `Return ONLY a valid JSON object matching the ProjectSpecification schema:`,
    `{`,
    `  "version": 1,`,
    `  "projectIntent": { "summary": "...", "productType": "web_app", "targetUsers": [], "primaryGoals": [], "successCriteria": [] },`,
    `  "requirements": { "functional": [], "nonFunctional": [], "businessRules": [], "constraints": [], "acceptanceCriteria": [] },`,
    `  "pages": [{ "name": "...", "route": "/", "purpose": "...", "sections": [{ "name": "...", "purpose": "...", "components": [] }], "requiredComponents": [], "sourceReferences": [] }],`,
    `  "designSystem": { "visualDirection": "...", "colors": [{ "role": "primary", "hex": "#10B981" }], "typography": [], "spacingGuidance": [], "componentGuidance": [], "responsiveRequirements": [] },`,
    `  "dataModel": [{ "entity": "...", "fields": [{ "name": "...", "type": "String", "required": true, "unique": false }], "relations": [], "sourceReferences": [] }],`,
    `  "integrations": [],`,
    `  "implementationConstraints": [],`,
    `  "ambiguities": [],`,
    `  "assumptions": [],`,
    `  "sourceEvidence": [{ "sourceId": "att-1", "sourceName": "...", "type": "image_reference", "role": "homepage layout", "description": "...", "confidence": 0.95 }],`,
    `  "confidence": 0.95`,
    `}`,
  );

  return parts.join("\n");
}
