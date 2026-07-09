# exifregistry-website

Marketing website and brand kit for [exifregistry](https://github.com/daviarndt/exifregistry) — the photographer's metadata toolkit.

**Live at [exifregistry.com](https://exifregistry.com)** (GitHub Pages).

## Structure

```
public/           # the deployed site (static)
├── index.html    # one-page site (client-rendered component + full SEO head)
├── support.js    # component runtime
├── favicon.svg / favicon-32.png / apple-touch-icon.png
├── og.png        # social preview card (1200x630)
└── CNAME         # custom domain for GitHub Pages
brand-kit/        # visual identity assets as delivered (logos, source, archive)
scripts/          # sanity checks run in CI before every deploy
```

## Development

```bash
npm run dev      # serve public/ locally
npm run check    # verify links, install command and meta tags
```

Every push to `main` runs the checks and deploys to GitHub Pages automatically.

## Brand

Identity derives from the product itself: Space Mono (the font exifregistry renders EXIF captions with) and the 21-color `exifreg frame --colors` palette. See [brand-kit/README.md](brand-kit/README.md) for the full system.

## License

[MIT](LICENSE)
