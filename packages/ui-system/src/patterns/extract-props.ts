import ts from "typescript";

const TRAILING_SEPARATOR = /[;,]\s*$/;

function propsInterface(source: ts.SourceFile, exportName: string): ts.InterfaceDeclaration | undefined {
  const wanted = `${exportName}Props`;
  return source.statements.find(
    (statement): statement is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(statement) && statement.name.text === wanted,
  );
}

function flatten(text: string): string {
  return text.replace(/\s+/g, " ").replace(TRAILING_SEPARATOR, "").trim();
}

export function extractPropsSummary(sourceText: string, exportName: string): string | null {
  const source = ts.createSourceFile(`${exportName}.tsx`, sourceText, ts.ScriptTarget.ES2023, true, ts.ScriptKind.TSX);
  const declaration = propsInterface(source, exportName);
  if (!declaration) return null;
  return `{ ${declaration.members.map((member) => flatten(member.getText(source))).join("; ")} }`;
}
