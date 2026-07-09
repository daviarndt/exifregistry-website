/**
 * Sanity checks for the site: required meta tags, correct package/repo
 * references, no leftover wrong install commands. Run with `npm run check`.
 */

import { readFileSync } from "node:fs";

const html = readFileSync("public/index.html", "utf8");
const problems = [];

const mustContain = [
  ["<title>exifregistry", "page <title>"],
  ['property="og:image"', "OG image tag"],
  ['rel="canonical" href="https://exifregistry.com/"', "canonical URL"],
  ["npm install -g exifregistry", "install command"],
  ["https://github.com/daviarndt/exifregistry", "GitHub repo link"],
  ["https://www.npmjs.com/package/exifregistry", "npm package link"],
  ["buymeacoffee.com/daviarndtx", "Buy Me a Coffee link"],
  ['href="/favicon.svg"', "favicon link"],
];
for (const [needle, label] of mustContain) {
  if (!html.includes(needle)) problems.push(`missing ${label} (${needle})`);
}

const mustNotContain = [
  ["npm install -g exif-registry", "hyphenated install command (package does not exist)"],
  ["npm install -g exif-kit", "legacy package install command"],
  ["github.com/daviarndt/exif-registry", "hyphenated GitHub URL"],
  ["<title>Bundled Page</title>", "placeholder title"],
  [">-registry<", "hyphenated wordmark (name is exifregistry, no hyphen)"],
  ["exif-registry", "hyphenated product name"],
];
for (const [needle, label] of mustNotContain) {
  if (html.includes(needle)) problems.push(`found ${label} (${needle})`);
}

if (problems.length > 0) {
  console.error("Site check FAILED:");
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("Site check passed.");
