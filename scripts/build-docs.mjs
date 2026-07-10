/**
 * Generates public/docs/index.html from the command reference data below.
 * Run: node scripts/build-docs.mjs  (also runs in the deploy workflow)
 *
 * Style rule: NO em-dashes anywhere in the copy.
 */

import { mkdirSync, writeFileSync } from "node:fs";

const GROUPS = [
  {
    id: "inspect",
    title: "Inspect & analyze",
    commands: [
      {
        name: "show",
        usage: "exifreg show <files...> [options]",
        summary:
          "Prints a curated metadata report: camera, lens, shutter count, serial number, full exposure block, dates, GPS. Use it any time you need to know what a file really says about itself: checking gear info before selling a camera, confirming a fix worked, or reading the shutter count of a body you are about to buy.",
        options: [
          ["-v, --verbose", "also list every remaining tag after the key fields"],
          ["-a, --all", "flat alphabetical dump of every tag (raw values)"],
          ["--json", "machine-readable output for scripts"],
          ["-r, --recursive", "recurse into subfolders"],
          ["-e, --export [file.md]", "also save the report as Markdown", "<name>.metadata.md"],
        ],
        examples: [
          ["exifreg show IMG_4021.CR3", "key fields for one file"],
          ["exifreg show trip/ -r -v", "whole folder, every tag"],
          ["exifreg show photo.jpg -e report.md", "archive the report as Markdown"],
        ],
      },
      {
        name: "diff",
        usage: "exifreg diff <fileA> <fileB> [options]",
        summary:
          "Compares the metadata of two files side by side and shows only what differs. Typical case: an exported JPEG next to its RAW, to see exactly what the editor changed, kept or stripped. Filesystem identity tags (name, folder, access dates) are excluded so the table stays meaningful.",
        options: [["-a, --all", "also list the tags whose values are identical"]],
        examples: [
          ["exifreg diff original.CR3 exported.jpg", "what did the export change?"],
        ],
      },
      {
        name: "stats",
        usage: "exifreg stats <paths...> [options]",
        summary:
          "Aggregates a library's metadata into terminal bar charts: which cameras and lenses you actually use, favorite focal lengths and apertures, ISO habits, shots per month and per hour of day. Great before buying or selling gear, or just to understand your own shooting.",
        options: [
          ["-r, --recursive", "recurse into subfolders"],
          ["--json", "machine-readable output"],
          ["-e, --export [file.md]", "export the report to Markdown", "library-stats.md"],
        ],
        examples: [
          ["exifreg stats ~/Photos -r", "the whole library at a glance"],
          ["exifreg stats 2026/ -e year-review.md", "a year in review, exported"],
        ],
      },
      {
        name: "find",
        usage: 'exifreg find <paths...> -w "<condition>" [options]',
        summary:
          "Queries files by metadata and prints matching paths, one per line, ready to pipe into any other command. Conditions look like ISO>3200, Model=Canon EOS R6 or LensModel~35mm. Repeat -w to AND conditions. Numbers compare numerically; EXIF dates compare chronologically; ~ means contains.",
        options: [
          ["-w, --where <condition>", "required; repeat to combine with AND"],
          ["-r, --recursive", "recurse into subfolders"],
        ],
        examples: [
          ['exifreg find . -w "ISO>3200"', "the noisy ones"],
          ['exifreg find . -w "Model~canon" -w "DateTimeOriginal>=2026:07"', "Canon shots since July"],
          ['exifreg find . -w "GPSLatitude>0" | xargs exifreg gps --remove', "strip GPS wherever it exists"],
        ],
        notes: "Operators: = != > >= < <= and ~ (contains). Keys and string values are case-insensitive. Exit code is 1 when nothing matches, so it behaves well in scripts.",
      },
    ],
  },
  {
    id: "edit",
    title: "Edit metadata",
    commands: [
      {
        name: "gps",
        usage: "exifreg gps <files...> [options]",
        summary:
          "Sets or removes the GPS position. Paste coordinates straight from Google or Apple Maps with --coords, or pass --lat/--lon. Works on videos too (QuickTime GPSCoordinates). Use --remove before sharing photos of your home or a client's address.",
        options: [
          ['-c, --coords "<lat, lon>"', "coordinates as copied from a maps app"],
          ["--lat <deg> / --lon <deg>", "decimal degrees, as an alternative to --coords"],
          ["--alt <meters>", "altitude"],
          ["--remove", "delete all GPS data instead"],
          ["--no-backup", "skip the automatic _original backup"],
        ],
        examples: [
          ['exifreg gps beach.jpg --coords "-23.5505, -46.6333"', "set a location"],
          ["exifreg gps home-session/*.jpg --remove", "privacy before delivery"],
        ],
      },
      {
        name: "date",
        usage: "exifreg date <files...> [options]",
        summary:
          "Fixes capture and modification dates. The killer option is --shift: when the camera clock was wrong or on the wrong timezone, shift every date by the same amount without touching anything else. Accepts friendly date forms like 2026-07-05 14:30 or 05/07/2026.",
        options: [
          ["-t, --taken <datetime>", "capture date (DateTimeOriginal + CreateDate)"],
          ["-m, --modified <datetime>", "metadata modification date"],
          ["--all <datetime>", "set taken, created and modified at once"],
          ['-s, --shift "<amount>"', 'shift all dates: "+2h", "-30m", "+1d 2h30m"'],
          ["--sync-file", "also set the file's own modified date to the capture date"],
          ["--no-backup", "skip the automatic backup"],
        ],
        examples: [
          ['exifreg date *.CR3 --shift "+2h"', "clock was two hours behind"],
          ['exifreg date scan.jpg --taken "1994-12-25"', "date a scanned print"],
        ],
      },
      {
        name: "timezone",
        usage: "exifreg timezone <files...> [options]",
        summary:
          "Writes the UTC offset tags (OffsetTimeOriginal and friends) that most cameras leave empty. With --from-gps each photo's offset is derived from its own coordinates, offline, with daylight saving handled at the capture date. Editors and catalogs then stop guessing what time your photos were really taken.",
        options: [
          ['--offset "±HH:MM"', 'explicit offset, e.g. "-03:00"'],
          ["--from-gps", "derive each photo's offset from its GPS position"],
          ["--no-backup", "skip the automatic backup"],
        ],
        examples: [
          ['exifreg timezone *.jpg --offset "-03:00"', "shot in Brazil"],
          ["exifreg timezone trip/ --from-gps", "multi-country trip, each photo correct"],
        ],
      },
      {
        name: "copy",
        usage: "exifreg copy <source> <targets...> [--no-backup]",
        summary:
          "Copies all metadata from one file onto others. The classic case: an export or a panorama stitch came out clean of EXIF, and you want the original's camera info, dates and GPS back on it.",
        options: [["--no-backup", "skip the automatic backup"]],
        examples: [["exifreg copy original.CR3 stitched-pano.jpg", "restore lost EXIF"]],
      },
      {
        name: "sign",
        usage: "exifreg sign <files...> [options]",
        summary:
          "Stamps your authorship (Artist and Copyright) into files in bulk. Save a preset once with --save-preset and from then on a plain exifreg sign folder/ is enough. {year} in the copyright text becomes the current year automatically.",
        options: [
          ["--artist <name>", "artist / creator name"],
          ['--copyright "<text>"', 'copyright notice; "{year}" expands'],
          ["--save-preset", "store artist/copyright as the default preset"],
          ["--no-backup", "skip the automatic backup"],
        ],
        examples: [
          ['exifreg sign *.jpg --artist "Davi Arndt" --copyright "© {year} Davi Arndt" --save-preset', "first time"],
          ["exifreg sign wedding/", "every time after that"],
        ],
      },
      {
        name: "strip",
        usage: "exifreg strip <files...> [options]",
        summary:
          "Removes ALL metadata: camera, dates, GPS, serial numbers, everything. For privacy-safe sharing when the picture should speak and the data should not. Asks for confirmation unless you pass -y.",
        options: [
          ["-y, --yes", "skip the confirmation prompt"],
          ["--no-backup", "skip the automatic backup"],
        ],
        examples: [["exifreg strip listing-photos/*.jpg -y", "publish clean files"]],
      },
      {
        name: "undo",
        usage: "exifreg undo <files...>",
        summary:
          "Every metadata edit keeps the untouched original next to the file with an _original suffix. undo puts it back. Accepts the edited file, the _original itself, or a whole folder to restore every backup inside.",
        options: [],
        examples: [
          ["exifreg undo photo.jpg", "revert the last edit of one file"],
          ["exifreg undo wedding/", "revert everything in a folder"],
        ],
      },
    ],
  },
  {
    id: "organize",
    title: "Organize files",
    commands: [
      {
        name: "organize",
        usage: "exifreg organize <paths...> --to <dir> [options]",
        summary:
          "Moves (or copies) photos into folders derived from their metadata: by date, by camera, even by city using offline GPS geocoding. RAW+JPEG pairs and sidecar files always travel together. Dry-run by default; nothing is ever overwritten; every executed batch can be undone.",
        options: [
          ["--to <dir>", "destination root", "current folder"],
          ['--by "<pattern>"', "folder pattern, see placeholders below", "{year}/{date}"],
          ["--copy", "copy instead of move"],
          ["-r, --recursive", "recurse into subfolders"],
          ["--apply", "execute (default is a preview)"],
          ["--undo", "revert the last executed batch under --to"],
        ],
        examples: [
          ['exifreg organize card/ --to ~/Photos --by "{year}/{date}" --apply', "the classic import layout"],
          ['exifreg organize . --by "{camera}/{date}"', "two-shooter wedding, split by body"],
          ['exifreg organize . --by "{country}/{city}"', "travel archive, fully offline"],
        ],
      },
      {
        name: "rename",
        usage: 'exifreg rename <files...> -p "<pattern>" [options]',
        summary:
          "Renames files in place from their metadata, keeping pairs and sidecars in matching names. {counter} numbers files in shooting order, which fixes the classic two-cameras-same-counter mess.",
        options: [
          ['-p, --pattern "<pattern>"', "filename pattern", "{date}_{time}_{name}"],
          ["-r, --recursive", "recurse into subfolders"],
          ["--apply", "execute (default is a preview)"],
          ["--undo <folder>", "revert the last rename in that folder"],
        ],
        examples: [
          ['exifreg rename . -p "wedding_{counter:3}" --apply', "wedding_001.CR3, _002..."],
        ],
      },
      {
        name: "ingest",
        usage: "exifreg ingest <card> --to <dir> [options]",
        summary:
          "Imports a memory card: copies into organized folders and, with --verify, checks every copy against a SHA-256 checksum before you ever consider formatting the card. Copies by default; the card keeps its files unless you pass --move.",
        options: [
          ["--to <dir>", "destination root (required)"],
          ['--by "<pattern>"', "folder pattern under --to", "{year}/{date}"],
          ["--verify", "checksum-verify every copy"],
          ["--move", "move instead of copy"],
          ["--apply", "execute (default is a preview)"],
          ["--undo", "revert the last ingest under --to"],
        ],
        examples: [
          ["exifreg ingest /Volumes/EOS_R6 --to ~/Photos --verify --apply", "the safe import"],
        ],
      },
      {
        name: "split",
        usage: "exifreg split <dir> [--apply] [--undo]",
        summary:
          "Sorts a mixed folder into Photos/, RAW/ and Videos/ subfolders. For that downloads folder where everything landed together.",
        options: [
          ["--apply", "execute (default is a preview)"],
          ["--undo", "revert the last split in this folder"],
        ],
        examples: [["exifreg split ~/Downloads/mixed --apply", "three tidy piles"]],
      },
      {
        name: "dupes",
        usage: "exifreg dupes <paths...> [options]",
        summary:
          "Finds byte-identical duplicates (size first, then SHA-256, so false positives are impossible) and reports how much space they waste. Deletion is opt-in, keeps the first of each group, and asks for confirmation. This is the one operation without an undo, so it is triple-gated.",
        options: [
          ["-r, --recursive", "recurse into subfolders"],
          ["--delete", "plan deletion of the duplicates"],
          ["--apply", "with --delete: actually delete (confirmed interactively)"],
        ],
        examples: [
          ["exifreg dupes ~/Photos -r", "report only, always safe"],
          ["exifreg dupes ~/Photos -r --delete --apply", "reclaim the space"],
        ],
      },
    ],
  },
  {
    id: "archive",
    title: "Archive",
    commands: [
      {
        name: "backup",
        usage: "exifreg backup <sources...> --to <dir> [options]",
        summary:
          "Verified, append-only backups with a SHA-256 manifest. Deletions never propagate, changed files are versioned under _versions/ instead of overwritten, every copy is atomic and checksum-verified, and --verify re-checks every byte to catch silent corruption. Read the full story on the backup page.",
        options: [
          ["--to <dir>", "backup root (required)"],
          ['--by "<pattern>"', "organized layout instead of mirroring folders"],
          ["--paranoid", "re-hash every file instead of trusting size and date"],
          ["--verify", "re-hash the whole backup against its manifest"],
          ["--status", "files, size, versions, capture span"],
          ["--apply", "execute (default is a preview)"],
        ],
        examples: [
          ["exifreg backup ~/Photos --to /Volumes/Backup --apply", "the habit worth having"],
          ["exifreg backup --verify --to /Volumes/Backup", "monthly integrity check"],
        ],
      },
      {
        name: "restore",
        usage: "exifreg restore <backup-root> [options]",
        summary:
          "Restores from a backup: everything, or a slice by capture date thanks to the manifest. Files that already exist with identical content are skipped; files that differ are conflicts and are never overwritten; a backup copy that fails its own checksum is refused rather than restored.",
        options: [
          ["--to <dir>", "restore into this folder instead of the original locations"],
          ['--taken <date>', 'only files captured then: "2026", "2026-07", "2026-07-05"'],
          ["--apply", "execute (default is a preview)"],
        ],
        examples: [
          ["exifreg restore /Volumes/Backup --apply", "put missing originals back"],
          ["exifreg restore /Volumes/Backup --taken 2026-07 --to ./recovered --apply", "one month, elsewhere"],
        ],
      },
    ],
  },
  {
    id: "publish",
    title: "Prepare & publish",
    commands: [
      {
        name: "frame",
        usage: "exifreg frame <files...> [options]",
        summary:
          'Re-renders photos inside an aesthetic colored frame with their exposure caption in Space Mono: the "shot on" portfolio look. RAW files work through their embedded previews. The output keeps the original photo\'s EXIF.',
        options: [
          ["-c, --color <name|#hex>", "frame color; list all 21 with --colors", "white"],
          ["--ratio <W:H|original>", '"1:1", "4:5", "9:16", "3:2"...', "original"],
          ["--caption <pos>", "bottom, top or none", "bottom"],
          ["--camera", "include the camera model in the caption"],
          ["--margin <pct>", "margin around the photo", "6"],
          ["--size <px|full>", '"full" keeps the photo at native resolution', "3000"],
          ["-q, --quality <1-100>", "JPEG quality of the render", "95"],
          ["-o, --out <dir>", "output folder", "next to each photo"],
          ["--colors", "list the palette with names and hex codes"],
        ],
        examples: [
          ["exifreg frame photo.CR3 -c off-white --ratio 4:5", "Instagram-ready"],
          ["exifreg frame photo.jpg -c sage --caption none --size full", "just the frame, print-grade"],
        ],
      },
      {
        name: "resize",
        usage: "exifreg resize <files...> [options]",
        summary:
          'Resizes and converts into NEW files; originals are never touched and the EXIF is carried over. The standout option is --max-size: say "1mb" and a binary search finds the highest quality that fits, so you stop guessing quality numbers.',
        options: [
          ['-s, --max-size <size>', 'target file size: "1mb", "500kb"'],
          ["--long <px>", "resize the long edge"],
          ["--width / --height <px>", "fit within a box"],
          ["--percent <n>", "scale by percentage"],
          ["-f, --format <fmt>", "jpeg, png, webp, avif, tiff", "keep"],
          ["-q, --quality <1-100>", "explicit quality", "85"],
          ["-o, --out <dir>", "output folder"],
          ["--suffix <text>", "inserted before the extension", "resized"],
        ],
        examples: [
          ["exifreg resize photo.jpg --max-size 1mb", "client asked for under 1 MB"],
          ["exifreg resize *.jpg --long 2048 -f webp -o web/", "web-ready batch"],
        ],
      },
      {
        name: "contact",
        usage: "exifreg contact <paths...> [options]",
        summary:
          "Renders a contact sheet: a thumbnail grid with filename and exposure labels, as a single JPEG. The classic deliverable for a client to pick selects from. RAW files contribute their embedded previews.",
        options: [
          ["-c, --columns <n>", "thumbnails per row", "4"],
          ["--cell <px>", "width of each cell", "320"],
          ["-o, --out <file.jpg>", "output file", "<name>-contact.jpg"],
          ["-r, --recursive", "recurse into subfolders"],
        ],
        examples: [
          ["exifreg contact selects/ -c 5 --out client.jpg", "send one file, get picks back"],
        ],
      },
    ],
  },
  {
    id: "utility",
    title: "Utility",
    commands: [
      {
        name: "doctor",
        usage: "exifreg doctor",
        summary:
          "Checks that the installation is healthy: version and the bundled ExifTool responding. Run it once after installing, or when something feels off.",
        options: [],
        examples: [["exifreg doctor", "all green in one second"]],
      },
    ],
  },
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function commandHtml(cmd) {
  const options =
    cmd.options.length === 0
      ? ""
      : `<table class="opts"><tr><th>Option</th><th>What it does</th><th>Default</th></tr>${cmd.options
          .map(
            ([flag, desc, def]) =>
              `<tr><td class="mono">${esc(flag)}</td><td>${esc(desc)}</td><td class="mono soft">${esc(def ?? "")}</td></tr>`,
          )
          .join("")}</table>`;
  const examples = cmd.examples
    .map(
      ([line, comment]) =>
        `<div><span class="p">$</span> ${esc(line)}  <span class="d"># ${esc(comment)}</span></div>`,
    )
    .join("\n");
  const notes = cmd.notes
    ? `<p class="notes">${esc(cmd.notes)}</p>`
    : "";
  return `
    <article class="cmd" id="${cmd.name}">
      <h3 class="mono"><span class="accent">exifreg</span> ${cmd.name}</h3>
      <div class="usage mono">${esc(cmd.usage)}</div>
      <p>${esc(cmd.summary)}</p>
      ${options}
      ${notes}
      <div class="term"><div class="term-body">${examples}</div></div>
    </article>`;
}

const sidebar = GROUPS.map(
  (g) =>
    `<div class="side-group"><div class="side-title mono">${g.title}</div>${g.commands
      .map((c) => `<a href="#${c.name}" class="mono">${c.name}</a>`)
      .join("")}</div>`,
).join("");

const sections = GROUPS.map(
  (g) => `
  <section id="${g.id}">
    <h2 class="mono group-title">${g.title}</h2>
    ${g.commands.map(commandHtml).join("\n")}
  </section>`,
).join("\n");

const PLACEHOLDERS = [
  ["{year} {month} {day}", "capture date parts (from DateTimeOriginal, with sensible fallbacks)"],
  ["{date}", "2026-07-05"],
  ["{time} {hour} {minute} {second}", "capture time parts"],
  ["{camera}", "camera model, e.g. Canon EOS R6"],
  ["{lens}", "lens model"],
  ["{type}", "Photos, RAW or Videos"],
  ["{name} {ext}", "original file name / extension"],
  ["{city} {region} {country}", "from GPS, resolved offline"],
  ["{counter} {counter:4}", "sequence number in shooting order, optionally padded"],
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Documentation · exifregistry</title>
<meta name="description" content="Full reference for every exifregistry command: what it does, when to use it, every option and real examples. The photographer's metadata toolkit, documented.">
<link rel="canonical" href="https://exifregistry.com/docs/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://exifregistry.com/docs/">
<meta property="og:title" content="Documentation · exifregistry">
<meta property="og:description" content="Every command, every option, real examples. The photographer's metadata toolkit, documented.">
<meta property="og:image" content="https://exifregistry.com/og.png">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FAF4EC">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#2A2320">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:80px}
  body{margin:0}
  :root{
    --bg:#FAF4EC; --surface:#FFFFFF; --surface-2:#F6F1E7;
    --border:#E7DDCD; --border-strong:#D7CCB9;
    --fg:#2E2E2E; --fg-2:#5A5149; --fg-muted:#8A8073;
    --accent:#C4704F; --accent-strong:#A85638; --link:#A85638;
    --term-bg:#241C18; --term-fg:#EDE4D6; --term-dim:#A9998A;
    --term-green:#9FB37A; --term-prompt:#DD9273; --term-border:#3A2E27;
    --chrome:rgba(250,244,236,.72);
    --shadow:0 1px 2px rgba(46,34,26,.06),0 12px 40px -12px rgba(46,34,26,.18);
  }
  :root[data-theme="dark"]{
    --bg:#2A2320; --surface:#332B27; --surface-2:#2F2723;
    --border:#43392F; --border-strong:#55483B;
    --fg:#F3EADC; --fg-2:#CFC4B4; --fg-muted:#9A8E7E;
    --accent:#D08869; --accent-strong:#E0A184; --link:#E0A184;
    --chrome:rgba(42,35,32,.72);
    --shadow:0 1px 2px rgba(0,0,0,.3),0 16px 44px -14px rgba(0,0,0,.55);
  }
  body{background:var(--bg);color:var(--fg);font-family:'IBM Plex Sans',ui-sans-serif,system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;transition:background .25s,color .25s}
  a{color:var(--link);text-decoration:none}
  a:hover{color:var(--accent-strong)}
  ::selection{background:var(--accent);color:#fff}
  .mono{font-family:'Space Mono',ui-monospace,monospace}
  .accent{color:var(--accent)}
  .layout{max-width:1180px;margin:0 auto;padding:40px 24px;display:grid;grid-template-columns:210px minmax(0,1fr);gap:44px;align-items:start}
  aside{position:sticky;top:80px;font-size:13px}
  .side-group{margin-bottom:18px}
  .side-title{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-muted);margin-bottom:6px}
  aside a{display:block;padding:3px 0;color:var(--fg-2);font-size:13px}
  aside a:hover{color:var(--accent)}
  h1{font-family:'Space Mono',monospace;font-weight:700;font-size:clamp(30px,4vw,42px);letter-spacing:-.03em;margin:0 0 14px}
  .group-title{font-weight:700;font-size:clamp(22px,2.6vw,28px);letter-spacing:-.02em;margin:52px 0 6px;padding-top:18px;border-top:1px solid var(--border)}
  .cmd{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:24px 26px;box-shadow:var(--shadow);margin-top:20px}
  .cmd h3{margin:0 0 10px;font-size:19px;font-weight:700;letter-spacing:-.01em}
  .usage{font-size:13px;color:var(--fg-2);background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:12px;overflow-x:auto;white-space:nowrap}
  .cmd p{font-size:14.5px;color:var(--fg-2);margin:0 0 14px}
  .notes{font-size:13.5px;color:var(--fg-muted)}
  table.opts{width:100%;border-collapse:collapse;font-size:13.5px;margin:0 0 14px}
  table.opts th{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-muted);text-align:left;padding:6px 10px;border-bottom:1px solid var(--border)}
  table.opts td{padding:7px 10px;border-bottom:1px solid var(--border);vertical-align:top}
  table.opts td.mono{font-size:12.5px;white-space:nowrap}
  table.opts td.soft{color:var(--fg-muted)}
  .term{background:var(--term-bg);border:1px solid var(--term-border);border-radius:10px;overflow:hidden}
  .term-body{padding:13px 16px;font-family:'Space Mono',monospace;font-size:12.5px;line-height:1.7;color:var(--term-fg);overflow-x:auto}
  .term-body div{white-space:pre}
  .p{color:var(--term-prompt)} .d{color:var(--term-dim)}
  .conv{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:24px 26px;box-shadow:var(--shadow);margin-top:20px}
  .conv h3{margin:0 0 8px;font-size:16px}
  .conv p, .conv li{font-size:14px;color:var(--fg-2)}
  @media (max-width:900px){
    .layout{grid-template-columns:minmax(0,1fr)}
    aside{position:static;display:flex;flex-wrap:wrap;gap:4px 14px;border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface)}
    .side-group{margin:0}
    .nav-link{display:none}
  }
</style>
</head>
<body>

<header style="position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:var(--chrome);border-bottom:1px solid var(--border)">
  <nav style="max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:22px">
    <a href="/" style="display:flex;align-items:center;gap:10px;color:var(--fg);flex-shrink:0;white-space:nowrap">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><path d="M4 10V4H10"/><path d="M22 4H28V10"/><path d="M28 22V28H22"/><path d="M10 28H4V22"/></g><rect x="12" y="12" width="8" height="8" rx="1.5" fill="var(--accent)"/></svg>
      <span class="mono" style="font-weight:700;font-size:17px;letter-spacing:-.02em">exifregistry</span>
      <span class="mono nav-link" style="font-size:12px;color:var(--fg-muted);border:1px solid var(--border-strong);border-radius:999px;padding:3px 10px">/docs</span>
    </a>
    <div style="flex:1"></div>
    <a href="/" class="nav-link" style="font-size:14px;color:var(--fg-2)">Home</a>
    <a href="/backup/" class="nav-link" style="font-size:14px;color:var(--fg-2)">Backups</a>
    <a href="https://github.com/daviarndt/exifregistry" class="nav-link" style="font-size:14px;color:var(--fg-2)">GitHub</a>
    <a href="https://buymeacoffee.com/daviarndtx" style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--fg);border:1px solid var(--border-strong);background:var(--surface);border-radius:999px;padding:7px 13px;white-space:nowrap">☕<span class="nav-link"> Buy me a coffee</span></a>
    <button id="themeToggle" aria-label="Toggle color theme" style="width:36px;height:36px;border-radius:9px;border:1px solid var(--border-strong);background:var(--surface);color:var(--fg);cursor:pointer;font-size:15px">☾</button>
  </nav>
</header>

<div class="layout">
  <aside>
    ${sidebar}
    <div class="side-group"><div class="side-title mono">Reference</div><a href="#conventions" class="mono">conventions</a><a href="#placeholders" class="mono">placeholders</a></div>
  </aside>

  <main>
    <h1>Documentation</h1>
    <p style="font-size:16px;color:var(--fg-2);max-width:62ch">Every command, every option, and when to reach for each one. Install with <span class="mono" style="font-size:14px">npm install -g exifregistry</span>, run bare <span class="mono" style="font-size:14px">exifreg</span> for the interactive guided mode, or use the commands below directly.</p>

    <div class="conv" id="conventions">
      <h3>Conventions that hold everywhere</h3>
      <ul style="margin:0;padding-left:20px;display:grid;gap:6px">
        <li><strong>Previews first.</strong> Every file operation prints its full plan and only executes with <span class="mono" style="font-size:13px">--apply</span>.</li>
        <li><strong>Backups by default.</strong> Every metadata edit keeps the untouched original (suffix <span class="mono" style="font-size:13px">_original</span>); revert with <span class="mono" style="font-size:13px">undo</span>. Opt out per command with <span class="mono" style="font-size:13px">--no-backup</span>.</li>
        <li><strong>Nothing is overwritten.</strong> Name collisions get numeric suffixes, always.</li>
        <li><strong>Pairs stay together.</strong> RAW+JPEG twins and .xmp/.aae sidecars move, rename and back up as one unit.</li>
        <li><strong>Pixels are never touched.</strong> Metadata edits rewrite metadata segments only; frame and resize write new files.</li>
        <li><strong>100% local.</strong> No network calls, ever. Even GPS-to-city and GPS-to-timezone lookups use bundled databases.</li>
      </ul>
    </div>

    <div class="conv" id="placeholders">
      <h3>Pattern placeholders (organize, rename, ingest, backup --by)</h3>
      <table class="opts"><tr><th>Placeholder</th><th>Meaning</th></tr>
      ${PLACEHOLDERS.map(([k, v]) => `<tr><td class="mono">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}
      </table>
    </div>

    ${sections}

    <p style="margin-top:44px;font-size:14px;color:var(--fg-muted)">Something missing or wrong? <a href="https://github.com/daviarndt/exifregistry/issues">Open an issue</a>. Docs generated from the same reference the tool ships with.</p>
  </main>
</div>

<footer style="border-top:1px solid var(--border);margin-top:40px">
  <div style="max-width:1180px;margin:0 auto;padding:36px 24px;display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
    <span class="mono" style="font-weight:700;font-size:15px">exif<span class="accent">registry</span></span>
    <div style="display:flex;gap:22px;font-size:13.5px;color:var(--fg-2);flex-wrap:wrap">
      <a href="https://github.com/daviarndt/exifregistry">GitHub</a>
      <a href="https://www.npmjs.com/package/exifregistry">npm</a>
      <a href="https://buymeacoffee.com/daviarndtx">☕ Buy me a coffee</a>
      <span>MIT License</span>
    </div>
  </div>
</footer>

<script>
(function () {
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  var theme = stored || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  apply(theme);
  document.getElementById("themeToggle").addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", theme); } catch (e) {}
    apply(theme);
  });
  function apply(t) {
    root.setAttribute("data-theme", t);
    document.getElementById("themeToggle").textContent = t === "dark" ? "☀" : "☾";
  }
})();
</script>
</body>
</html>
`;

mkdirSync("public/docs", { recursive: true });
writeFileSync("public/docs/index.html", html);
const count = GROUPS.reduce((n, g) => n + g.commands.length, 0);
console.log(`docs built: ${count} commands documented`);
