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
  ["exifreg backup", "backup feature showcase"],
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
// --- backup page
const backup = readFileSync("public/backup/index.html", "utf8");
const backupMust = [
  ['rel="canonical" href="https://exifregistry.com/backup/"', "backup page canonical"],
  ["npm install -g exifregistry", "backup page install command"],
  ['href="/"', "backup page link home"],
  ["buymeacoffee.com/daviarndtx", "backup page BMC link"],
];
for (const [needle, label] of backupMust) {
  if (!backup.includes(needle)) problems.push(`missing ${label} (${needle})`);
}
for (const [needle, label] of [["exif-registry", "hyphenated name (backup page)"], ["\u2014", "em-dash in backup page prose"]]) {
  if (backup.includes(needle)) problems.push(`found ${label}`);
}
if (!html.includes('href="/backup/"')) problems.push("home page does not link to /backup/");

if (problems.length > 0) {
  console.error("Site check FAILED:");
  for (const p of problems) console.error(`  \u2717 ${p}`);
  process.exit(1);
}
console.log("Site check passed.");
