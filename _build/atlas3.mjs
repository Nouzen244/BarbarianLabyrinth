// Atlas of B and C object tiles (Outside), laid out at their tileset grid
// positions over a grass background so transparency shows.
import { savePreview, fillLayer, setT } from './maplib.mjs';
const TSID = 2, W = 16, H = 16;
// B id from grid (gx,gy): left 8 cols => gy*8+gx ; right 8 cols => 128 + gy*8 + (gx-8)
const bid = (gx, gy) => gx < 8 ? gy*8+gx : 128 + gy*8 + (gx-8);

for (const [base, name] of [[0, 'B'], [256, 'C']]) {
  const map = { width: W, height: H, tilesetId: TSID, data: new Array(W*H*6).fill(0) };
  fillLayer(map, 0, 2816); // grass bg
  for (let gy=0; gy<16; gy++) for (let gx=0; gx<16; gx++) setT(map, gx, gy, 2, base + bid(gx, gy));
  savePreview(map, TSID, `_build/atlas_${name}.png`, 2);
  console.error(`atlas_${name}.png laid out 16x16; id = ${base} + (gx<8? gy*8+gx : 128+gy*8+gx-8)`);
}
