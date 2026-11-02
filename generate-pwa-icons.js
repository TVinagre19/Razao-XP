import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard Brand SVG (for display / favicon / regular icon)
const svgStandard = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="leatherGrad" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#34435e"/>
      <stop offset="100%" stop-color="#1b2333"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE082"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#8C6514"/>
    </linearGradient>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF7"/>
      <stop offset="100%" stop-color="#ECE3C8"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#090c12" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="104" fill="url(#leatherGrad)"/>
  
  <!-- Outer Gold Border -->
  <rect x="24" y="24" width="464" height="464" rx="84" fill="none" stroke="url(#goldGrad)" stroke-width="6" opacity="0.85"/>
  <rect x="36" y="36" width="440" height="440" rx="72" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6"/>

  <!-- Vintage Ledger Book Crest / Plaque -->
  <g filter="url(#shadow)">
    <!-- Book shape -->
    <rect x="96" y="96" width="320" height="320" rx="28" fill="url(#paperGrad)" stroke="#C7B583" stroke-width="4"/>
    <!-- Red vertical ledger line -->
    <line x1="168" y1="96" x2="168" y2="416" stroke="#9B3A2C" stroke-width="2.5" opacity="0.5"/>
    <!-- Faint horizontal ruled lines -->
    <line x1="96" y1="160" x2="416" y2="160" stroke="#D9CCA3" stroke-width="1.5"/>
    <line x1="96" y1="210" x2="416" y2="210" stroke="#D9CCA3" stroke-width="1.5"/>
    <line x1="96" y1="260" x2="416" y2="260" stroke="#D9CCA3" stroke-width="1.5"/>
    <line x1="96" y1="310" x2="416" y2="310" stroke="#D9CCA3" stroke-width="1.5"/>
    <line x1="96" y1="360" x2="416" y2="360" stroke="#D9CCA3" stroke-width="1.5"/>
    
    <!-- Central Wax / Gold Seal -->
    <circle cx="256" cy="256" r="88" fill="#28344A" stroke="url(#goldGrad)" stroke-width="6"/>
    <circle cx="256" cy="256" r="76" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"/>

    <!-- Gold Text: RAZÃO XP -->
    <text x="256" y="222" font-family="'Times New Roman', serif" font-size="20" font-weight="bold" fill="#D4AF37" letter-spacing="4" text-anchor="middle">RAZÃO</text>
    <text x="256" y="286" font-family="'Times New Roman', serif" font-size="54" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="2">XP</text>
    <text x="256" y="318" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#C7B583" text-anchor="middle" letter-spacing="3">LIVRO · LIVRE</text>
  </g>
</svg>
`;

// 2. Maskable SVG: Full bleed background, essential elements strictly inside the central 80% circle (diameter 410px, radius 205px)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="leatherGradM" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#34435e"/>
      <stop offset="100%" stop-color="#1b2333"/>
    </radialGradient>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE082"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#8C6514"/>
    </linearGradient>
    <linearGradient id="paperGradM" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF7"/>
      <stop offset="100%" stop-color="#ECE3C8"/>
    </linearGradient>
  </defs>

  <!-- Full Bleed Background (no border radius so Android can crop safely) -->
  <rect width="512" height="512" fill="url(#leatherGradM)"/>

  <!-- Subtle corner parchment lines -->
  <circle cx="256" cy="256" r="230" fill="none" stroke="url(#goldGradM)" stroke-width="2" opacity="0.3"/>

  <!-- Centered Safe-Zone Ledger Plaque (Strictly within the inner 75%) -->
  <g transform="translate(256, 256) scale(0.82) translate(-256, -256)">
    <rect x="86" y="86" width="340" height="340" rx="36" fill="url(#paperGradM)" stroke="#C7B583" stroke-width="5"/>
    <line x1="162" y1="86" x2="162" y2="426" stroke="#9B3A2C" stroke-width="3" opacity="0.5"/>
    
    <!-- Ruled lines -->
    <line x1="86" y1="154" x2="426" y2="154" stroke="#D9CCA3" stroke-width="2"/>
    <line x1="86" y1="206" x2="426" y2="206" stroke="#D9CCA3" stroke-width="2"/>
    <line x1="86" y1="256" x2="426" y2="256" stroke="#D9CCA3" stroke-width="2"/>
    <line x1="86" y1="306" x2="426" y2="306" stroke="#D9CCA3" stroke-width="2"/>
    <line x1="86" y1="358" x2="426" y2="358" stroke="#D9CCA3" stroke-width="2"/>

    <!-- Central seal -->
    <circle cx="256" cy="256" r="92" fill="#28344A" stroke="url(#goldGradM)" stroke-width="7"/>
    <circle cx="256" cy="256" r="80" fill="none" stroke="#D4AF37" stroke-width="1.8" stroke-dasharray="4 4" opacity="0.8"/>

    <text x="256" y="218" font-family="'Times New Roman', serif" font-size="22" font-weight="bold" fill="#D4AF37" letter-spacing="4" text-anchor="middle">RAZÃO</text>
    <text x="256" y="284" font-family="'Times New Roman', serif" font-size="60" font-weight="900" fill="url(#goldGradM)" text-anchor="middle" letter-spacing="2">XP</text>
    <text x="256" y="320" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#C7B583" text-anchor="middle" letter-spacing="3">LIVRO · LIVRE</text>
  </g>
</svg>
`;

async function run() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgStandard.trim());
  console.log('Saved public/icon.svg');

  const bufStandard = Buffer.from(svgStandard);
  const bufMaskable = Buffer.from(svgMaskable);

  // 192x192
  await sharp(bufStandard)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved pwa-192x192.png');

  // 512x512
  await sharp(bufStandard)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved pwa-512x512.png');

  // 512x512 Maskable
  await sharp(bufMaskable)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved pwa-maskable-512x512.png');

  // 180x180 Apple touch icon
  await sharp(bufStandard)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved apple-touch-icon.png');

  // favicon 48x48 png
  await sharp(bufStandard)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Saved favicon.png');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
