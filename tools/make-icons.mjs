// Original icon: a ink-dark rounded tile, a blue hand-drawn check, a red deadline dot.
// Rasterises 4 PNG sizes with no third-party libraries, then writes tools/icon.svg for reference.
// Run from the workspace root: node tools/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'extension', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const BG = [0x12, 0x14, 0x1a];
const CHECK = [0x8a, 0xb4, 0xf8];
const DOT = [0xf2, 0x8b, 0x82];
const SS = 8;

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const segDist = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
};

function render(size) {
  const W = size * SS;
  const art0 = (size / 8) * SS;
  const A = (size * 3 / 4) * SS;
  const art1 = art0 + A;
  const buf = new Float32Array(W * W * 4); // premultiplied

  const blend = (x, y, col, a) => {
    const i = (y * W + x) * 4;
    const ia = 1 - a;
    buf[i] = (col[0] / 255) * a + buf[i] * ia;
    buf[i + 1] = (col[1] / 255) * a + buf[i + 1] * ia;
    buf[i + 2] = (col[2] / 255) * a + buf[i + 2] * ia;
    buf[i + 3] = a + buf[i + 3] * ia;
  };
  const fillIf = (test, col) => {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (test(x + 0.5, y + 0.5)) blend(x, y, col, 1);
  };

  // rounded tile
  const r = A * 0.235, cx = (art0 + art1) / 2, hx = A / 2 - r;
  fillIf((px, py) => {
    const qx = Math.abs(px - cx) - hx, qy = Math.abs(py - cx) - hx;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r <= 0;
  }, BG);

  // hand-drawn check
  const P = (fx, fy) => [art0 + fx * A, art0 + fy * A];
  const [p1x, p1y] = P(0.22, 0.55), [p2x, p2y] = P(0.42, 0.74), [p3x, p3y] = P(0.75, 0.35);
  const hw = A * 0.115 / 2;
  fillIf((px, py) => Math.min(
    segDist(px, py, p1x, p1y, p2x, p2y),
    segDist(px, py, p2x, p2y, p3x, p3y),
  ) <= hw, CHECK);

  // deadline dot, with a tile-coloured ring so it reads separately from the check tip
  const [dx, dy] = P(0.83, 0.16);
  const dotR = A * 0.075, ringR = A * 0.115;
  fillIf((px, py) => { const d = Math.hypot(px - dx, py - dy); return d > dotR && d <= ringR; }, BG);
  fillIf((px, py) => Math.hypot(px - dx, py - dy) <= dotR, DOT);

  const out = Buffer.alloc(size * size * 4);
  const n = SS * SS;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const i = (((y * SS + sy) * W) + (x * SS + sx)) * 4;
      r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3];
    }
    a /= n; r /= n; g /= n; b /= n;
    const o = (y * size + x) * 4;
    if (a > 0) {
      out[o] = Math.round(Math.min(255, (r / a) * 255));
      out[o + 1] = Math.round(Math.min(255, (g / a) * 255));
      out[o + 2] = Math.round(Math.min(255, (b / a) * 255));
    }
    out[o + 3] = Math.round(Math.min(255, a * 255));
  }
  return out;
}

function alphaBox(rgba, size) {
  let x0 = size, y0 = size, x1 = -1, y1 = -1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (rgba[(y * size + x) * 4 + 3] > 0) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1 };
}

for (const size of [16, 32, 48, 128]) {
  const rgba = render(size);
  const box = alphaBox(rgba, size);
  const pad = size / 8;
  if (box.x0 !== Math.round(pad) || box.y0 !== Math.round(pad) || box.x1 !== size - 1 - Math.round(pad) || box.y1 !== size - 1 - Math.round(pad)) {
    throw new Error(`unexpected artwork bounds at ${size}px: ${JSON.stringify(box)}`);
  }
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), encodePNG(size, size, rgba));
  console.log(`icon${size}.png artwork ${box.x1 - box.x0 + 1}x${box.y1 - box.y0 + 1} at (${box.x0},${box.y0})`);
}

const art0 = 16, A = 96;
const P = (fx, fy) => [art0 + fx * A, art0 + fy * A];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <title>Maddy New Tab</title>
  <rect x="16" y="16" width="96" height="96" rx="${(A * 0.235).toFixed(2)}" fill="#12141a"/>
  <path d="M${P(0.22, 0.55).join(' ')} L${P(0.42, 0.74).join(' ')} L${P(0.75, 0.35).join(' ')}" fill="none" stroke="#8ab4f8" stroke-width="${(A * 0.115).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${P(0.83, 0.16)[0].toFixed(2)}" cy="${P(0.83, 0.16)[1].toFixed(2)}" r="${(A * 0.115).toFixed(2)}" fill="#12141a"/>
  <circle cx="${P(0.83, 0.16)[0].toFixed(2)}" cy="${P(0.83, 0.16)[1].toFixed(2)}" r="${(A * 0.075).toFixed(2)}" fill="#f28b82"/>
</svg>
`;
fs.writeFileSync(path.join(root, 'tools', 'icon.svg'), svg);
console.log('wrote tools/icon.svg');
