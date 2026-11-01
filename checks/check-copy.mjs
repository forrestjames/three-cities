// Checks the voice rules on text people read: no em dashes, none of the words
// Jim does not say. Skips CSS and code comments. Usage: node checks/check-copy.mjs [files...] [--strict]
import { targets, read, lineOf, blank, root } from "./lib.mjs";
import { relative } from "node:path";

// design.html quotes the "Not this" examples on purpose, so it is skipped by default.
const banned = [/\brevolutionary\b/i, /\bmagic(?:al)?\b/i, /\bseamless(?:ly)?\b/i, /\bunlock\b/i, /\bimmersive\b/i, /\bexperience (?:a|the)\b/i, /\blands?\b(?= (?:for|with|on you|right))/i, /\bsoundscape\b/i];
const strict = process.argv.includes("--strict");
let total = 0;

const files = targets(process.argv.slice(2)).filter((f) => process.argv.slice(2).some((a) => !a.startsWith("--")) || !f.endsWith("design.html"));
for (const file of files) {
  let text = read(file);
  if (text === null) continue;
  text = blank(text, /<style[\s\S]*?<\/style>/gi);
  text = blank(text, /<!--[\s\S]*?-->/g);
  text = blank(text, /\/\*[\s\S]*?\*\//g);
  text = blank(text, /^\s*\/\/.*$/gm);
  const hits = [];
  for (const m of text.matchAll(/—/g)) hits.push([lineOf(text, m.index), "em dash"]);
  for (const re of banned) for (const m of text.matchAll(new RegExp(re.source, "gi"))) hits.push([lineOf(text, m.index), `"${m[0]}"`]);
  if (!hits.length) continue;
  console.log(`\n${relative(root, file)}`);
  for (const [line, what] of hits.sort((a, b) => a[0] - b[0]).slice(0, 25)) console.log(`  line ${line}: ${what}`);
  if (hits.length > 25) console.log(`  ... and ${hits.length - 25} more`);
  total += hits.length;
}

console.log(total ? `\n${total} voice issue(s). Warm, plain, short sentences, no em dashes.` : "Copy follows the voice rules.");
if (strict && total) process.exit(1);
