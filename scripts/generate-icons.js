const fs = require('fs');
const path = require('path');

// 1. Remove conflicting files in src/app so Next.js App Router serves static files directly from public/
const srcAppIcon = path.join(__dirname, '../src/app/icon.png');
const srcAppFavicon = path.join(__dirname, '../src/app/favicon.ico');

if (fs.existsSync(srcAppIcon)) fs.unlinkSync(srcAppIcon);
if (fs.existsSync(srcAppFavicon)) fs.unlinkSync(srcAppFavicon);
console.log('Removed conflicting src/app metadata icons.');

// 2. Read public/icon.png (our clean square 512x512 PNG)
const iconPngPath = path.join(__dirname, '../public/icon.png');
const pngBuffer = fs.readFileSync(iconPngPath);

// 3. Create a 100% valid ICO file containing the PNG image
// ICO Header: 6 bytes
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // 1 image

// ICO Directory Entry: 16 bytes
const icoDir = Buffer.alloc(16);
icoDir.writeUInt8(0, 0); // Width: 0 means 256 or larger
icoDir.writeUInt8(0, 1); // Height: 0 means 256 or larger
icoDir.writeUInt8(0, 2); // Color palette
icoDir.writeUInt8(0, 3); // Reserved
icoDir.writeUInt16LE(1, 4); // Color planes
icoDir.writeUInt16LE(32, 6); // Bits per pixel (32bpp)
icoDir.writeUInt32LE(pngBuffer.length, 8); // Size of PNG data
icoDir.writeUInt32LE(22, 12); // Offset = 6 + 16 = 22

const validIcoBuffer = Buffer.concat([icoHeader, icoDir, pngBuffer]);
const faviconPath = path.join(__dirname, '../public/favicon.ico');
fs.writeFileSync(faviconPath, validIcoBuffer);

console.log('Generated 100% valid public/favicon.ico (size: ' + validIcoBuffer.length + ' bytes)');
console.log('public/icon.png exists (size: ' + pngBuffer.length + ' bytes)');
