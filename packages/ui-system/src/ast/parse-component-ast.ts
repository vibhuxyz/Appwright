import ts from "typescript";
import type { ComponentNode } from "./types";

function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

function getTagName(element: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string | null {
  const expr = element.tagName;
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return null;
}

function collectJsxUsages(sourceFile: ts.SourceFile, startNode: ts.Node): { children: string[]; props: string[] } {
  const children: string[] = [];
  const props: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = getTagName(node);
      if (tagName && isPascalCase(tagName) && !children.includes(tagName)) {
        children.push(tagName);
      }
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || !ts.isIdentifier(attr.name)) continue;
        const propName = attr.name.text;
        if (!props.includes(propName)) props.push(propName);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(startNode);
  return { children, props };
}

export function parseComponentFileAst(filePath: string, content: string): ComponentNode[] {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const components: ComponentNode[] = [];

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      const name = node.name.text;
      const isDefault = Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword));
      const isExport = Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
      const { children, props } = collectJsxUsages(sourceFile, node);
      components.push({ name, filePath, isDefaultExport: isDefault, isNamedExport: isExport && !isDefault, children, props });
    } else if (ts.isVariableStatement(node)) {
      const isExport = Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && isPascalCase(decl.name.text) && decl.initializer) {
          const name = decl.name.text;
          const { children, props } = collectJsxUsages(sourceFile, decl.initializer);
          components.push({ name, filePath, isDefaultExport: false, isNamedExport: isExport, children, props });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return components;
}
