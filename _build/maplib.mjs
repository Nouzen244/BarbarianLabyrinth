// Map utilities: a faithful MV tile renderer (for previewing maps we build in
// code) + helpers. Rendering mirrors rpg_core.js Tilemap exactly.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const PROJ = 'E:/project/game/BarbarianLabyrinth';
const TS = 48, H1 = 24;

// ---- tile id constants / helpers (from rpg_core) ----
export const ID = { B:0, C:256, D:512, E:768, A5:1536, A1:2048, A2:2816, A3:4352, A4:5888, MAX:8192 };
const isAutotile = id => id >= ID.A1;
const autotileKind = id => Math.floor((id - ID.A1) / 48);
const autotileShape = id => (id - ID.A1) % 48;
const isA1 = id => id >= ID.A1 && id < ID.A2;
const isA2 = id => id >= ID.A2 && id < ID.A3;
const isA3 = id => id >= ID.A3 && id < ID.A4;
const isA4 = id => id >= ID.A4 && id < ID.MAX;
const isA5 = id => id >= ID.A5 && id < ID.A1;

// ---- autotile shape tables (from rpg_core) ----
const FLOOR = [[[2,4],[1,4],[2,3],[1,3]],[[2,0],[1,4],[2,3],[1,3]],[[2,4],[3,0],[2,3],[1,3]],[[2,0],[3,0],[2,3],[1,3]],[[2,4],[1,4],[2,3],[3,1]],[[2,0],[1,4],[2,3],[3,1]],[[2,4],[3,0],[2,3],[3,1]],[[2,0],[3,0],[2,3],[3,1]],[[2,4],[1,4],[2,1],[1,3]],[[2,0],[1,4],[2,1],[1,3]],[[2,4],[3,0],[2,1],[1,3]],[[2,0],[3,0],[2,1],[1,3]],[[2,4],[1,4],[2,1],[3,1]],[[2,0],[1,4],[2,1],[3,1]],[[2,4],[3,0],[2,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,4],[1,4],[0,3],[1,3]],[[0,4],[3,0],[0,3],[1,3]],[[0,4],[1,4],[0,3],[3,1]],[[0,4],[3,0],[0,3],[3,1]],[[2,2],[1,2],[2,3],[1,3]],[[2,2],[1,2],[2,3],[3,1]],[[2,2],[1,2],[2,1],[1,3]],[[2,2],[1,2],[2,1],[3,1]],[[2,4],[3,4],[2,3],[3,3]],[[2,4],[3,4],[2,1],[3,3]],[[2,0],[3,4],[2,3],[3,3]],[[2,0],[3,4],[2,1],[3,3]],[[2,4],[1,4],[2,5],[1,5]],[[2,0],[1,4],[2,5],[1,5]],[[2,4],[3,0],[2,5],[1,5]],[[2,0],[3,0],[2,5],[1,5]],[[0,4],[3,4],[0,3],[3,3]],[[2,2],[1,2],[2,5],[1,5]],[[0,2],[1,2],[0,3],[1,3]],[[0,2],[1,2],[0,3],[3,1]],[[2,2],[3,2],[2,3],[3,3]],[[2,2],[3,2],[2,1],[3,3]],[[2,4],[3,4],[2,5],[3,5]],[[2,0],[3,4],[2,5],[3,5]],[[0,4],[1,4],[0,5],[1,5]],[[0,4],[3,0],[0,5],[1,5]],[[0,2],[3,2],[0,3],[3,3]],[[0,2],[1,2],[0,5],[1,5]],[[0,4],[3,4],[0,5],[3,5]],[[2,2],[3,2],[2,5],[3,5]],[[0,2],[3,2],[0,5],[3,5]],[[0,0],[1,0],[0,1],[1,1]]];
const WALL = [[[2,2],[1,2],[2,1],[1,1]],[[0,2],[1,2],[0,1],[1,1]],[[2,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],[[2,2],[3,2],[2,1],[3,1]],[[0,2],[3,2],[0,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,0],[3,0],[0,1],[3,1]],[[2,2],[1,2],[2,3],[1,3]],[[0,2],[1,2],[0,3],[1,3]],[[2,0],[1,0],[2,3],[1,3]],[[0,0],[1,0],[0,3],[1,3]],[[2,2],[3,2],[2,3],[3,3]],[[0,2],[3,2],[0,3],[3,3]],[[2,0],[3,0],[2,3],[3,3]],[[0,0],[3,0],[0,3],[3,3]]];

// ---- tileset bitmap loading ----
export function loadBitmaps(tilesetId) {
  const ts = JSON.parse(fs.readFileSync(`${PROJ}/data/Tilesets.json`, 'utf8'))[tilesetId];
  const names = ts.tilesetNames; // [A1,A2,A3,A4,A5,B,C,D,E]
  const bmps = [];
  for (let i = 0; i < 9; i++) {
    const n = names[i];
    if (n) { const buf = fs.readFileSync(`${PROJ}/img/tilesets/${n}.png`); bmps[i] = PNG.sync.read(buf); }
    else bmps[i] = null;
  }
  return bmps;
}

// alpha-composite a w x h block from src(px,py) onto dst(dx,dy)
function blit(src, px, py, w, h, dst, dx, dy) {
  if (!src) return;
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const sxp = px + xx, syp = py + yy;
      if (sxp < 0 || syp < 0 || sxp >= src.width || syp >= src.height) continue;
      const si = (syp * src.width + sxp) * 4;
      const a = src.data[si + 3]; if (a === 0) continue;
      const dxp = dx + xx, dyp = dy + yy;
      if (dxp < 0 || dyp < 0 || dxp >= dst.width || dyp >= dst.height) continue;
      const di = (dyp * dst.width + dxp) * 4;
      if (a === 255) {
        dst.data[di] = src.data[si]; dst.data[di+1] = src.data[si+1];
        dst.data[di+2] = src.data[si+2]; dst.data[di+3] = 255;
      } else {
        const af = a / 255, ia = 1 - af;
        dst.data[di]   = src.data[si]   * af + dst.data[di]   * ia;
        dst.data[di+1] = src.data[si+1] * af + dst.data[di+1] * ia;
        dst.data[di+2] = src.data[si+2] * af + dst.data[di+2] * ia;
        dst.data[di+3] = Math.max(dst.data[di+3], a);
      }
    }
  }
}

function drawNormal(id, dst, dx, dy, bmps) {
  const setNumber = isA5(id) ? 4 : 5 + Math.floor(id / 256);
  const sx = (Math.floor(id / 128) % 2 * 8 + id % 8) * TS;
  const sy = (Math.floor(id % 256 / 8) % 16) * TS;
  blit(bmps[setNumber], sx, sy, TS, TS, dst, dx, dy);
}

function drawAutotile(id, dst, dx, dy, bmps) {
  let table = FLOOR;
  const kind = autotileKind(id), shape = autotileShape(id);
  const tx = kind % 8, ty = Math.floor(kind / 8);
  let bx = 0, by = 0, setNumber = 0;
  if (isA1(id)) { setNumber = 0;
    if (kind === 0) { bx = 0; by = 0; } else if (kind === 1) { bx = 0; by = 3; }
    else if (kind === 2) { bx = 6; by = 0; } else if (kind === 3) { bx = 6; by = 3; }
    else { bx = Math.floor(tx / 4) * 8; by = ty * 6 + Math.floor(tx / 2) % 2 * 3; }
  } else if (isA2(id)) { setNumber = 1; bx = tx * 2; by = (ty - 2) * 3; }
  else if (isA3(id)) { setNumber = 2; bx = tx * 2; by = (ty - 6) * 2; table = WALL; }
  else if (isA4(id)) { setNumber = 3; bx = tx * 2; by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0)); if (ty % 2 === 1) table = WALL; }
  const t = table[shape]; if (!t) return;
  for (let i = 0; i < 4; i++) {
    const qsx = t[i][0], qsy = t[i][1];
    blit(bmps[setNumber], (bx * 2 + qsx) * H1, (by * 2 + qsy) * H1, H1, H1,
      dst, dx + (i % 2) * H1, dy + Math.floor(i / 2) * H1);
  }
}

export function renderMap(map, bmps) {
  const W = map.width, H = map.height, n = W * H;
  const png = new PNG({ width: W * TS, height: H * TS });
  png.data.fill(0);
  for (let z = 0; z < 4; z++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const id = map.data[(z * H + y) * W + x];
      if (!id) continue;
      if (isAutotile(id)) drawAutotile(id, png, x * TS, y * TS, bmps);
      else drawNormal(id, png, x * TS, y * TS, bmps);
    }
  }
  return png;
}

function upscale(png, s) {
  if (s <= 1) return png;
  const out = new PNG({ width: png.width * s, height: png.height * s });
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const si = (Math.floor(y / s) * png.width + Math.floor(x / s)) * 4;
    const di = (y * out.width + x) * 4;
    out.data[di] = png.data[si]; out.data[di+1] = png.data[si+1];
    out.data[di+2] = png.data[si+2]; out.data[di+3] = png.data[si+3];
  }
  return out;
}

// ---- map building helpers ----
export const atId = (kind, shape) => ID.A1 + kind * 48 + shape;        // autotile tile id
export const setT = (map, x, y, z, id) => { if (x>=0&&y>=0&&x<map.width&&y<map.height) map.data[(z*map.height+y)*map.width+x] = id; };
export const fillLayer = (map, z, id) => { for (let y=0;y<map.height;y++) for (let x=0;x<map.width;x++) setT(map,x,y,z,id); };
export const fillRect = (map, x0,y0,w,h,z,id) => { for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++) setT(map,x,y,z,id); };
// place a rect of a WALL-type autotile (A3 buildings / A4 walls), auto-shaping edges (16 shapes)
export function wallRect(map, x0, y0, w, h, kind, z = 1) {
  const inside = (x,y) => x>=x0 && x<x0+w && y>=y0 && y<y0+h;
  for (let y=y0;y<y0+h;y++) for (let x=x0;x<x0+w;x++) {
    let s = 0;
    if (!inside(x-1,y)) s|=1; if (!inside(x,y-1)) s|=2;
    if (!inside(x+1,y)) s|=4; if (!inside(x,y+1)) s|=8;
    setT(map, x, y, z, atId(kind, s));
  }
}
// place a multi-tile object from B/C direct tiles given top-left tile id and footprint
export function placeObject(map, x0, y0, w, h, topLeftId, z = 2) {
  // direct tiles are laid out row-major in 8-wide sub-blocks; use draw formula inverse:
  // simplest: object tiles are consecutive in the tileset grid; caller passes ids per cell
  // (overload below handles explicit id grid)
}
export function placeGrid(map, x0, y0, ids, z = 2) { // ids = 2D array [row][col]
  for (let r=0;r<ids.length;r++) for (let c=0;c<ids[r].length;c++) if (ids[r][c]) setT(map, x0+c, y0+r, z, ids[r][c]);
}

export function savePreview(map, tilesetId, outPath, scale = 1) {
  const bmps = loadBitmaps(tilesetId);
  const png = upscale(renderMap(map, bmps), scale);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  return outPath;
}
