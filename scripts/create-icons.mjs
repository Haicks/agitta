import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

// Render original vector artwork into the PNG sizes required by mobile browsers.
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await mkdir('public/icons', { recursive: true });
  for (const [name, size, maskable] of [['icon-192', 192, false], ['icon-512', 512, false], ['maskable-512', 512, true], ['apple-touch-icon', 180, true]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="#d6f55c"/><g transform="translate(64 64) scale(6)"><path d="m34 8-19 28h14l-3 20 24-31H35z" fill="#20241d"/></g></svg>`;
    const data = await page.evaluate(async ({ svg, size }) => {
      const img = new Image();
      img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      canvas.getContext('2d').drawImage(img, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { svg, size });
    await writeFile(`public/icons/${name}.png`, Buffer.from(data, 'base64'));
  }
} finally { await browser.close(); }
console.log('Ícones web gerados em public/icons/.');
