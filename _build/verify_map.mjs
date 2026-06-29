// Render a map with event markers (green = NPC, blue = exit/invisible) to check
// that nobody stands in a wall or on furniture. Usage: node verify_map.mjs <id>
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { loadBitmaps, renderMap } from './maplib.mjs';
const id = process.argv[2] || '003';
const map = JSON.parse(fs.readFileSync(`E:/project/game/BarbarianLabyrinth/data/Map${id}.json`, 'utf8'));
const png = renderMap(map, loadBitmaps(map.tilesetId));
const TS = 48;
function mark(x, y, r, g, b) { for (let dy=10; dy<TS-10; dy++) for (let dx=10; dx<TS-10; dx++) {
  const px=x*TS+dx, py=y*TS+dy, i=(py*png.width+px)*4; png.data[i]=r; png.data[i+1]=g; png.data[i+2]=b; png.data[i+3]=255; } }
for (const e of map.events) { if (!e) continue;
  const vis = e.pages[0].image.characterName; mark(e.x, e.y, vis?0:40, vis?210:80, vis?60:220); }
fs.writeFileSync(`E:/project/game/_build/verify_map${id}.png`, PNG.sync.write(png));
console.error(`verify_map${id}.png (green=visible NPC, blue=invisible/exit)`);
