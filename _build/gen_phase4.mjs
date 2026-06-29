// PHASE 4 — Рафдония city hub (Map002): walkable grass canvas + event "buildings"
// (door/gate sprites), a working General Market, race/black-market placeholders,
// NPCs, and gate transfers between the city and the Labyrinth Gate (Map001).
// Tile art is intentionally a plain canvas — repaint in the editor later.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const GRASS = 2816;            // A2 autotile center (same ground Map001 uses)
const CITY_ID = 2, GATE_ID = 1; // map ids: 2 = Рафдония, 1 = Врата Лабиринта
const W = 27, H = 21;

// ---- event/command helpers ----
const img = (name, idx = 0) => ({ tileId: 0, characterName: name, direction: 2, pattern: 1, characterIndex: idx });
const route = { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false };
const wrapText = (lines, max = 30) => { const out = [];
  for (const ln of lines) { if (ln.length <= max) { out.push(ln); continue; }
    let cur = ''; for (const w of ln.split(' ')) {
      if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w; }
      else cur = (cur ? cur + ' ' : '') + w; } if (cur) out.push(cur); }
  return out; };
const text = (lines) => { const l = [{ code: 101, indent: 0, parameters: ['', 0, 0, 2] }];
  for (const t of wrapText(lines)) l.push({ code: 401, indent: 0, parameters: [t] }); return l; };
const transfer = (mapId, x, y) => ({ code: 201, indent: 0, parameters: [0, mapId, x, y, 2, 0] });
const stop = { code: 0, indent: 0, parameters: [] };
function event(id, name, x, y, image, list, priority = 1, trigger = 0) {
  return { id, name, note: '', x, y, pages: [{
    conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: 'A',
      selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false,
      variableId: 1, variableValid: false, variableValue: 0 },
    directionFix: false, image, list, moveFrequency: 3, moveRoute: route, moveSpeed: 3,
    moveType: 0, priorityType: priority, stepAnime: false, through: false, trigger, walkAnime: true }] };
}
// shop goods: [type(0 item/1 weapon/2 armor), dataId, priceType(0 db price), price]
function shop(introLines, goods, purchaseOnly = false) {
  const l = text(introLines);
  l.push({ code: 302, indent: 0, parameters: [...goods[0], purchaseOnly] });
  for (let i = 1; i < goods.length; i++) l.push({ code: 605, indent: 0, parameters: goods[i] });
  l.push(stop);
  return l;
}

// ===================== Map002 — Рафдония =====================
const data = new Array(W * H * 6).fill(0);
for (let i = 0; i < W * H; i++) data[i] = GRASS;      // layer 0 = grass

const generalGoods = [
  [0, 1, 0, 0], [0, 2, 0, 0], [0, 3, 0, 0], [0, 4, 0, 0],  // potions, ether
  [0, 5, 0, 0], [0, 6, 0, 0],                               // food
  [0, 7, 0, 0], [0, 8, 0, 0],                               // bandages, antidote
  [0, 9, 0, 0], [0, 10, 0, 0],                              // torch, rope
];

const events = [null];
events[1] = event(1, 'Глашатай', 13, 16, img('People4', 0), [...text([
  '\\n<Глашатай>Добро пожаловать в Рафдонию.',
  'Лавки по бокам, Врата — на север.']), stop]);
events[2] = event(2, 'Врата Лабиринта', 13, 2, img('!$Gate1', 0),
  [...text(['Врата Лабиринта зияют чернотой. Войти?']), transfer(GATE_ID, 8, 7), stop]);
events[3] = event(3, 'Общий рынок', 8, 8, img('!Door1', 0),
  shop(['Торговец: Бери, что нужно для вылазки.'], generalGoods));
events[4] = event(4, 'Расовый магазин', 13, 8, img('!Door1', 1),
  [...text(['Лавка для своих. Товары зависят от расы.', '(Ассортимент откроется в Фазе 6.)']), stop]);
events[5] = event(5, 'Чёрный рынок', 18, 8, img('!Door2', 0),
  [...text(['Тёмный проход заколочен.', 'Чёрный рынок открывается через квест. (Фаза 6.)']), stop]);
events[6] = event(6, 'Стражник', 10, 5, img('People1', 0), [...text([
  'Веди себя достойно. Я слежу.']), stop]);
events[7] = event(7, 'Горожанка', 17, 12, img('People2', 1), [...text([
  'В Лабиринте снова видели разлом...']), stop]);

const city = {
  autoplayBgm: false, autoplayBgs: false, battleback1Name: '', battleback2Name: '',
  bgm: { name: '', pan: 0, pitch: 100, volume: 90 }, bgs: { name: '', pan: 0, pitch: 100, volume: 90 },
  disableDashing: false, displayName: 'Рафдония', encounterList: [], encounterStep: 30,
  height: H, note: '', parallaxLoopX: false, parallaxLoopY: false, parallaxName: '',
  parallaxShow: true, parallaxSx: 0, parallaxSy: 0, scrollType: 0, specifyBattleback: false,
  tilesetId: 1, width: W, data, events,
};
write('Map002', city);

// ===================== MapInfos =====================
const mi = read('MapInfos');
mi[1].name = 'Врата Лабиринта';
mi[2] = { id: 2, expanded: false, name: 'Рафдония', order: 2, parentId: 0, scrollX: 0, scrollY: 0 };
write('MapInfos', mi);

// ===================== Map001 — add "back to city" gate =====================
const gate = read('Map001');
gate.displayName = 'Врата Лабиринта';
gate.events[6] = event(6, 'В город', 2, 2, img('!$Gate2', 0),
  [...text(['Тропа ведёт обратно в Рафдонию.']), transfer(CITY_ID, 13, 18), stop]);
write('Map001', gate);

console.error('Map002 Рафдония:', W + 'x' + H, '| events:', events.filter(Boolean).length,
  '| MapInfos:', mi.filter(Boolean).map(e => e.id + ':' + e.name).join(', '));
