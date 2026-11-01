// Flags hex colours that are not in design-assets/tokens/tokens.css.
// Usage: node checks/check-hardcoded.mjs [files...] [--strict]
// Prints a summary. Exits 1 only with --strict, so it can start as a warning.
import { targets, read, tokenHexes, lineOf, root } from "./lib.mjs";
import { relative } from "node:path";

const allowed = tokenHexes();
const strict = process.argv.includes("--strict");
let total = 0;

for (const file of targets(process.argv.slice(2))) {
  const text = read(file);
  if (text === null) continue;
  const found = new Map();
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    const hex = m[0].toLowerCase();
    if (allowed.has(hex)) continue;
    if (!found.has(hex)) found.set(hex, []);
    found.get(hex).push(lineOf(text, m.index));
  }
  if (!found.size) continue;
  console.log(`\n${relative(root, file)}`);
  for (const [hex, lines] of [...found].sort((a, b) => b[1].length - a[1].length)) {
    total += lines.length;
    console.log(`  ${hex}  x${lines.length}  first at line ${lines[0]}`);
  }
}

console.log(total ? `\n${total} colour(s) outside the tokens. Add a token or use an existing one.` : "All colours are tokens.");
if (strict && total) process.exit(1);
