// Renders a labeled atlas of ground tiles (A2 autotile kinds + A5 direct tiles)
// for the Outside tileset so we can identify which tile id is grass/stone/etc.
import fs from 'node:fs';
import { savePreview } from './maplib.mjs';

const TSID = 2; // Outside
const W = 16, H = 20;
const data = new Array(W * H * 6).fill(0);
const set = (x, y, z, id) => { data[(z * H + y) * W + x] = id; };

// Section 1: A2 ground autotile kinds 16..31 (shape 0) along row 0-1
// id = 2048 + kind*48 + shape0 ; kinds 16..23 row0, 24..31 row1
for (let i = 0; i < 16; i++) {
  const kind = 16 + i;
  const x = i % 8, y = Math.floor(i / 8);
  set(x, y, 0, 2048 + kind * 48);
}

// Section 2: A5 direct tiles 1536..1663 (8 cols x 16 rows) starting at row 3
for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) {
  set(c, 3 + r, 0, 1536 + r * 8 + c);
}

const map = { width: W, height: H, tilesetId: TSID, data };
savePreview(map, TSID, '_build/atlas_ground.png');
console.error('atlas_ground.png: row0-1 = A2 kinds 16-31 (id 2816+i*48); rows 3-18 = A5 ids 1536+r*8+c');
