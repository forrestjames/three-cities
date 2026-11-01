// Flags padding, margin and gap values that are off the spacing scale.
// Scale (tokens.css): 4, 8, 14, 22, 34, plus 16 (phone gutter) and 30 (panel inside).
// Usage: node checks/check-spacing.mjs [files...] [--strict]
import { targets, read, lineOf, root } from "./lib.mjs";
import { relative } from "node:path";

const scale = new Set([0, 1, 2, 4, 8, 14, 16, 22, 30, 34]);
const strict = process.argv.includes("--strict");
const prop = /(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block))?\s*:\s*([^;}"]+)/g;
let total = 0;

for (const file of targets(process.argv.slice(2))) {
  const text = read(file);
  if (text === null) continue;
  const found = new Map();
  for (const m of text.matchAll(prop)) {
    for (const px of m[1].matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
      const n = Math.abs(parseFloat(px[1]));
      if (scale.has(n)) continue;
      if (!found.has(n)) found.set(n, []);
      found.get(n).push(lineOf(text, m.index));
    }
  }
  if (!found.size) continue;
  console.log(`\n${relative(root, file)}`);
  for (const [n, lines] of [...found].sort((a, b) => b[1].length - a[1].length)) {
    total += lines.length;
    console.log(`  ${n}px  x${lines.length}  first at line ${lines[0]}`);
  }
}

console.log(total ? `\n${total} spacing value(s) off the scale (4, 8, 14, 22, 34, 16 gutter).` : "All spacing is on the scale.");
if (strict && total) process.exit(1);
