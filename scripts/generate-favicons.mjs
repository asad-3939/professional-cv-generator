import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Packages PNG buffers into a multi-resolution ICO binary container (ICONDIR + ICONDIRENTRY + PNG payloads).
 * Supported natively by Windows Vista+, macOS, Linux, and all modern browsers without deprecated dependencies.
 */
function buildIcoFromPngEntries(entries) {
  const count = entries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + count * dirEntrySize;

  let offset = totalDirSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved (must be 0)
  header.writeUInt16LE(1, 2); // Image type: 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const dirBuffers = [];
  const dataBuffers = [];

  for (const { size, buffer } of entries) {
    const entry = Buffer.alloc(dirEntrySize);
    const dim = size >= 256 ? 0 : size;
    entry.writeUInt8(dim, 0); // Width
    entry.writeUInt8(dim, 1); // Height
    entry.writeUInt8(0, 2); // Color palette count (0 for PNG)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Image byte size
    entry.writeUInt32LE(offset, 12); // Offset from beginning of file
    offset += buffer.length;
    dirBuffers.push(entry);
    dataBuffers.push(buffer);
  }

  return Buffer.concat([header, ...dirBuffers, ...dataBuffers]);
}

const svgPath = path.resolve('public/favicon.svg');
const publicDir = path.resolve('public');

// Master SVG with crisp vector shapes for the 'AI' monogram
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="aiGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4338ca" />
      <stop offset="45%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#0d9488" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- High contrast rounded background badge -->
  <rect x="20" y="20" width="472" height="472" rx="118" fill="url(#aiGrad)" filter="url(#shadow)" />

  <!-- Crisp Vector 'A' -->
  <path d="M 125 362 L 205 150 L 247 150 L 327 362 L 273 362 L 255 312 L 197 312 L 179 362 Z M 210 274 L 242 274 L 226 226 Z" fill="#ffffff" />

  <!-- Crisp Vector 'I' -->
  <path d="M 337 150 L 387 150 L 387 362 L 337 362 Z" fill="#ffffff" />
</svg>`;

// Write normalized public/favicon.svg
fs.writeFileSync(svgPath, masterSvg, 'utf-8');

async function generateAllFavicons() {
  console.log('Generating favicon assets from SVG master...');

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 }, // Google SERP base 48px square requirement
    { name: 'apple-touch-icon.png', size: 180 }, // iOS 180x180
    { name: 'android-chrome-192x192.png', size: 192 }, // Android PWA 192x192
    { name: 'android-chrome-512x512.png', size: 512 } // Android PWA 512x512
  ];

  const pngBuffers = {};

  for (const item of sizes) {
    const outPath = path.join(publicDir, item.name);
    const buffer = await sharp(Buffer.from(masterSvg))
      .resize(item.size, item.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    
    fs.writeFileSync(outPath, buffer);
    pngBuffers[item.size] = buffer;
    console.log(`✓ Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Generate multi-size favicon.ico containing 16x16, 32x32, 48x48
  const icoBuffer = buildIcoFromPngEntries([
    { size: 16, buffer: pngBuffers[16] },
    { size: 32, buffer: pngBuffers[32] },
    { size: 48, buffer: pngBuffers[48] }
  ]);

  const icoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`✓ Generated favicon.ico (16x16, 32x32, 48x48 embedded multi-resolution)`);
}

generateAllFavicons().catch(err => {
  console.error('Error generating favicon assets:', err);
  process.exit(1);
});
