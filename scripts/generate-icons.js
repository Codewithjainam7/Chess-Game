import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // Color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // Compression method 0
  ihdrData.writeUInt8(0, 11); // Filter method 0
  ihdrData.writeUInt8(0, 12); // Interlace method 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

function drawChessIcon(x, y, w, h, maskable = false) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dx = nx - cx;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background squircle / rounded rect or full bleed for maskable
  let bgR = 24, bgG = 32, bgB = 47; // #18202f
  if (ny > 0.5) {
    bgR = 15; bgG = 23; bgB = 42; // #0f172a
  }

  if (!maskable) {
    // Round corner check (radius ~ 22%)
    const cornerR = 0.22;
    const ax = Math.abs(nx - 0.5);
    const ay = Math.abs(ny - 0.5);
    if (ax > 0.5 - cornerR && ay > 0.5 - cornerR) {
      const cdx = ax - (0.5 - cornerR);
      const cdy = ay - (0.5 - cornerR);
      if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerR) {
        return [0, 0, 0, 0]; // transparent outside squircle
      }
    }
  }

  // Draw chess piece (Knight silhouette / Crown emblem)
  // Crown / Knight shape
  // Base
  if (ny >= 0.68 && ny <= 0.78 && Math.abs(dx) <= 0.25) {
    return [248, 250, 252, 255]; // white piece
  }
  // Mid body / Knight neck
  if (ny >= 0.40 && ny < 0.68) {
    const halfWidth = 0.12 + (ny - 0.40) * 0.4;
    const centerShift = -0.04 + (ny - 0.40) * 0.1;
    if (Math.abs(nx - (0.5 + centerShift)) <= halfWidth) {
      return [241, 245, 249, 255];
    }
  }
  // Knight head & snout
  if (ny >= 0.24 && ny < 0.40) {
    // head ellipse + snout
    const hx = nx - 0.46;
    const hy = ny - 0.32;
    if ((hx * hx) / (0.16 * 0.16) + (hy * hy) / (0.11 * 0.11) <= 1.0) {
      // eye notch
      if (Math.abs(nx - 0.40) < 0.02 && Math.abs(ny - 0.30) < 0.02) {
        return [15, 23, 42, 255]; // dark eye
      }
      return [248, 250, 252, 255];
    }
    // snout
    if (nx >= 0.28 && nx <= 0.44 && ny >= 0.30 && ny <= 0.40) {
      return [248, 250, 252, 255];
    }
  }
  // Knight ears
  if (ny >= 0.18 && ny < 0.25 && nx >= 0.48 && nx <= 0.58) {
    return [226, 232, 240, 255];
  }

  // Subtle border / inner shadow
  if (dist < 0.44 && dist > 0.42 && !maskable) {
    return [59, 130, 246, 120]; // subtle blue ring
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.resolve('src/assets/icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, 192, (x, y, w, h) => drawChessIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, 512, (x, y, w, h) => drawChessIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'icon-maskable.png'), createPNG(512, 512, (x, y, w, h) => drawChessIcon(x, y, w, h, true)));
console.log('Icons generated successfully.');
