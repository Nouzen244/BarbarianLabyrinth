// Building/ground atlases for the Outside tileset, scaled up for readability.
import { savePreview } from './maplib.mjs';
const TSID = 2;

function mk(W, H) { const data = new Array(W * H * 6).fill(0);
  return { data, set: (x, y, id) => { data[(0 * H + y) * W + x] = id; }, map: (ts) => ({ width: W, height: H, tilesetId: ts, data }) }; }

// --- buildings: A3 roof kinds 48-63 (rows 0-1), A4 wall kinds 80-95 (rows 3-4) ---
{
  const b = mk(8, 5);
  for (let i = 0; i < 16; i++) b.set(i % 8, Math.floor(i / 8), 2048 + (48 + i) * 48);       // A3
  for (let i = 0; i < 16; i++) b.set(i % 8, 3 + Math.floor(i / 8), 2048 + (80 + i) * 48);    // A4
  savePreview(b.map(TSID), TSID, '_build/atlas_build.png', 3);
}
// --- A5 ground tiles 1536..1663, 8 cols x 16 rows ---
{
  const g = mk(8, 16);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) g.set(c, r, 1536 + r * 8 + c);
  savePreview(g.map(TSID), TSID, '_build/atlas_a5.png', 2);
}
console.error('atlas_build.png: A3 roofs kinds48-63 (rows0-1), A4 walls kinds80-95 (rows3-4)');
console.error('atlas_a5.png: A5 ids 1536 + row*8 + col');
