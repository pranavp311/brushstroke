/** Simple code formatting utilities */

export function indent(code: string, spaces: number = 2): string {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
}

export function stripLeadingNewlines(code: string): string {
  return code.replace(/^\n+/, "");
}

export function wrapInIIFE(code: string): string {
  return `(function() {\n${indent(code)}\n})();`;
}

export function moduleExport(name: string, code: string): string {
  return `${code}\n\nexport { ${name} };`;
}

export function reactComponentWrapper(
  name: string,
  body: string,
  imports: string[] = []
): string {
  const importLines = imports.map((i) => `import ${i};`).join("\n");
  return `${importLines ? importLines + "\n\n" : ""}export function ${name}(props) {
${indent(body)}
}`;
}
