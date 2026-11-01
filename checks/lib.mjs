// Shared helpers for the design checks. Plain Node, no packages.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Pages that are designed by hand. Generated pages (placement-test, sound-test)
// and the internal hubs are left out unless you pass files on the command line.
export const defaultFiles = ["index.html", "manual.html", "design.html", "teaser.html", "reel.html", "today.html"];

export function targets(argv) {
  const named = argv.filter((a) => !a.startsWith("--"));
  return (named.length ? named : defaultFiles).map((f) => join(root, f));
}

export function read(path) {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

export function tokenHexes() {
  const css = readFileSync(join(root, "design-assets/tokens/tokens.css"), "utf8");
  return new Set((css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).map((h) => h.toLowerCase()));
}

export function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

// Keep line numbers stable while removing blocks we do not want to scan.
export function blank(text, re) {
  return text.replace(re, (m) => m.replace(/[^\n]/g, " "));
}
