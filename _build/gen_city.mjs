// CITY ART v2 — Рафдония with a clear central road to the gate, buildings
// flanking left/right (doors at their base), grass borders, NPC mini-labels,
// and varied sprites. Repaints Map002; event LOGIC stays from phase4/phase6.
import fs from 'node:fs';
import { savePreview, fillLayer, fillRect, wallRect, setT } from './maplib.mjs';

const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const TSID = 2;
const GRASS = 2816, COBBLE = 1584;
const WALL = 61, ROOF = 48, STONE = 50;     // A3 kinds: white brick wall, red roof, stone wall
const DOOR = [48, 56];                        // B wooden door top/bottom
const TREE = [102, 110];

const map = JSON.parse(fs.readFileSync(`${DIR}/Map002.json`, 'utf8'));
const W = map.width, H = map.height;          // 27 x 21
for (let z = 0; z < 6; z++) fillLayer(map, z, 0);

// ground: grass base, cobblestone everywhere walkable, thin grass border + corners
fillLayer(map, 0, GRASS);
fillRect(map, 1, 2, W - 2, H - 3, 0, COBBLE);  // big plaza
fillRect(map, 12, 0, 3, 2, 0, COBBLE);         // gate road through the wall

// north city wall (stone) with a central gate opening at x12-14
wallRect(map, 0, 0, W, 2, STONE, 1);
fillRect(map, 12, 0, 3, 2, 1, 0);              // carve gate (remove wall tiles)

// castle gatehouse: two grey stone towers (C col0-1, gy6-11 = 2x6) flanking the gate
function tower(ox) { for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) setT(map, ox + c, r, 2, 384 + (6 + r) * 8 + c); }
tower(10); tower(15);

// buildings: door column cx, roof-top row topY. 6 wide, 5 tall, door at base.
function building(cx, topY) {
  const bx = cx - 2;
  wallRect(map, bx, topY, 6, 2, ROOF, 1);       // roof
  wallRect(map, bx, topY + 2, 6, 3, WALL, 1);   // wall
  setT(map, cx, topY + 3, 2, DOOR[0]);          // door top
  setT(map, cx, topY + 4, 2, DOOR[1]);          // door bottom (base)
  return [cx, topY + 4];
}
const dGeneral = building(4, 3);    // left, door (4,7)
const dRacial  = building(21, 3);   // right, door (21,7)
const dBlack   = building(4, 12);   // left back-alley, door (4,16)

// trees along the grass edges
for (const [tx, ty] of [[0,5],[0,9],[0,13],[0,18],[26,5],[26,10],[26,15],[26,19]]) {
  setT(map, tx, ty-1, 2, TREE[0]); setT(map, tx, ty, 2, TREE[1]);
}

// ---- plaza / castle decoration ----
// heraldic banners on the castle wall, flanking the gate (orange: C 280/288, blue: 282/290)
for (const bx2 of [9, 17]) { setT(map, bx2, 0, 2, 280); setT(map, bx2, 1, 2, 288); }
for (const bx2 of [12, 14]) { setT(map, bx2, 0, 2, 282); setT(map, bx2, 1, 2, 290); }
// a few more trees inside the walls to green up the plaza edges
for (const [tx, ty] of [[2,18],[24,18],[2,11],[24,11]]) { setT(map, tx, ty-1, 2, TREE[0]); setT(map, tx, ty, 2, TREE[1]); }

map.tilesetId = TSID;
map.autoplayBgm = true; map.bgm = { name: 'Town1', pan: 0, pitch: 100, volume: 80 };

// ---- events: positions, sprites, mini-labels ----
const invis = { tileId: 0, characterName: '', direction: 2, pattern: 1, characterIndex: 0 };
const spr = (n, i) => ({ tileId: 0, characterName: n, direction: 2, pattern: 1, characterIndex: i });
// id -> [x, y, sprite|null(invisible), labelText]
const EV = {
  1:  [13, 18, spr('People4', 0), 'Глашатай'],
  2:  [13, 2,  invis,             'Лабиринт'],
  // 3/4/5 (shop doors) are owned by gen_interiors (transfer + label)
  6:  [16, 10, spr('People1', 0), 'Стражник'],
  7:  [22, 14, spr('People2', 1), 'Горожанка'],
  8:  [8, 18,  spr('People3', 2), 'Контрабандист [Ч.Р.]'],
  9:  [10, 10, spr('People2', 2), 'Старейшина [Маска]'],
  10: [23, 17, spr('People4', 3), 'Хранитель [Печать]'],
};
function miniLabel(list, text) {
  list.unshift({ code: 408, indent: 0, parameters: ['<Always Show Mini Label>'] });
  list.unshift({ code: 108, indent: 0, parameters: [`<Mini Label: ${text}>`] });
}
for (const e of map.events) {
  if (!e || !EV[e.id]) continue;
  const [x, y, image, label] = EV[e.id];
  e.x = x; e.y = y; e.pages[0].image = image;
  miniLabel(e.pages[0].list, label);
}

// reset screen brightness on entering the city (clears any labyrinth tint)
const blankRoute = { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false };
const allFalse = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: 'A', selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
map.events[12] = { id: 12, name: 'СветГорода', note: '', x: 0, y: 0, pages: [{
  conditions: allFalse, directionFix: false, image: invis,
  list: [{ code: 223, indent: 0, parameters: [[0,0,0,0], 20, false] }, { code: 214, indent: 0, parameters: [] }, { code: 0, indent: 0, parameters: [] }],
  moveFrequency: 3, moveRoute: blankRoute, moveSpeed: 3, moveType: 0, priorityType: 0, stepAnime: false, through: true, trigger: 3, walkAnime: false,
}] };

fs.writeFileSync(`${DIR}/Map002.json`, JSON.stringify(map));
savePreview(map, TSID, '_build/preview_city.png', 2);
console.error('city v2 painted; doors:', JSON.stringify({ dGeneral, dRacial, dBlack }));
