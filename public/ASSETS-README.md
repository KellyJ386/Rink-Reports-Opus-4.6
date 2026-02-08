# Static Asset Generation Guide

## Required Assets

The following image assets need to be generated from the source `favicon.svg`:

### favicon.ico
- **Size:** 16x16, 32x32, 48x48 (multi-size ICO)
- **Source:** `public/favicon.svg`
- **Placement:** `src/app/favicon.ico` (Next.js convention) or `public/favicon.ico`

### PWA Icons (referenced in manifest.json)
- **icon-192.png** — 192x192 PNG
- **icon-512.png** — 512x512 PNG
- **Placement:** `public/`

### Apple Touch Icon
- **apple-touch-icon.png** — 180x180 PNG
- **Placement:** `public/`

## Generation Methods

### Option A: Online Tool
Use [RealFaviconGenerator](https://realfavicongenerator.net):
1. Upload `favicon.svg`
2. Configure settings for each platform
3. Download and extract the generated assets into `public/`

### Option B: CLI with Sharp
```bash
npm install -D sharp-cli

# Generate PNG icons from SVG
npx sharp -i public/favicon.svg -o public/icon-192.png resize 192 192
npx sharp -i public/favicon.svg -o public/icon-512.png resize 512 512
npx sharp -i public/favicon.svg -o public/apple-touch-icon.png resize 180 180
```

### Option C: Node.js Script with Sharp
```js
const sharp = require('sharp');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  sharp('public/favicon.svg')
    .resize(size, size)
    .png()
    .toFile(`public/${name}`);
}
```

For the `.ico` file, use a tool like [png-to-ico](https://www.npmjs.com/package/png-to-ico) or an online converter after generating the PNG.
