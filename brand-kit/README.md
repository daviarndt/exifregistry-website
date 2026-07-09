# exifregistry — Brand Kit

The complete visual identity and marketing site for **exifregistry**, the photographer's
metadata CLI (command: `exifreg`). All values are derived from the product's own
`exifreg frame --colors` palette.

## Contents
- `website/exifregistry.html` — the one-page site, fully self-contained (inline CSS/JS,
  fonts embedded). Works offline, light + dark theme, responsive.
- `logo/` — logo assets as SVG (symbol, wordmark, horizontal lockup) in color, mono,
  and white variants, plus `exifregistry-favicon.svg`.
- `source/exifregistry.dc.html` — editable source component.

## Logo
Viewfinder corner-brackets framing a terracotta matted-photo square — CLI-native,
reads as a camera focus point / framed subject. Monochrome-safe
(`exifregistry-symbol-mono.svg` uses `currentColor`) and legible down to 16px
(`exifregistry-favicon.svg`).

## Typography
- **Space Mono** (700 / 400) — display, headings, code, EXIF captions. The brand voice.
- **IBM Plex Sans** (600 / 500 / 400) — body & UI. Clean humanist counterpoint.
- Fallback stack: `"Space Mono", ui-monospace, monospace` and
  `"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif`.

## Color system
Primary **terracotta `#C4704F`** · supporting **sage `#B4BBA2`**, **olive `#6B7248`**.

Semantic — success `#6B7248` (olive) · warning `#D4A937` (mustard) · error `#5E2B35` (burgundy).

Light base `#FAF4EC` (off-white) · dark base `#2A2320` (warm charcoal, never pure black).
Terminal surface stays warm-dark `#241C18` in both themes.

Full 21-color product palette (neutrals + accents):
white `#FFFFFF` · off-white `#FAF4EC` · cream `#F6F1E7` · light-gray `#D9D9D9` ·
gray `#9A9A9A` · charcoal `#2E2E2E` · black `#000000` · terracotta `#C4704F` ·
sage `#B4BBA2` · olive `#6B7248` · forest `#24402F` · navy `#1E2A44` · denim `#4A6FA5` ·
slate `#64748B` · burgundy `#5E2B35` · mustard `#D4A937` · butter `#F2E3A1` ·
dusty-pink `#D8A7A7` · sand `#E7D8C9` · espresso `#3B2C26` · ivory `#FFFFF0`

## Install
```
npm install -g exifregistry
```

## License
Site & assets for exifregistry (MIT). Powered by ExifTool & libvips.
