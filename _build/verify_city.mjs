// Renders Map002 with event markers overlaid to verify nothing sits in a wall.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { loadBitmaps, renderMap } from './maplib.mjs';
const map = JSON.parse(fs.readFileSync('E:/project/game/BarbarianLabyrinth/data/Map002.json', 'utf8'));
const png = renderMap(map, loadBitmaps(map.tilesetId));
const TS = 48;
function marker(x, y, r, g, b) { // draw a filled square in tile cell
  for (let dy = 8; dy < TS-8; dy++) for (let dx = 8; dx < TS-8; dx++) {
    const px = x*TS+dx, py = y*TS+dy; const i = (py*png.width+px)*4;
    png.data[i]=r; png.data[i+1]=g; png.data[i+2]=b; png.data[i+3]=255;
  }
}
for (const e of map.events) { if (!e) continue;
  const door = [2,3,4,5].includes(e.id);
  marker(e.x, e.y, door?255:0, door?40:200, door?40:0); // door=red, npc=green
}
// upscale x2 via re-render path not needed; write directly
fs.writeFileSync('E:/project/game/_build/verify_city.png', PNG.sync.write(png));
console.error('verify_city.png written (red=door/gate trigger, green=NPC)');
