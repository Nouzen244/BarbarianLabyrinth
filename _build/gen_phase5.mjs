// PHASE 5 — Character creation: race + class selection.
// Builds CommonEvent 1 (the selection logic) and a Map001 autorun trigger.
// Re-runnable.
import fs from 'node:fs';
import { fillLayer, wallRect } from './maplib.mjs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const classes = read('Classes');
const className = id => classes[id].name;

// race -> [classId,classId,classId]
const RACES = [
  { id: 1, label: 'Варвар (сила/танк)',       classes: [1, 2, 3] },
  { id: 2, label: 'Эльф (ловкость/магия)',    classes: [4, 5, 6] },
  { id: 3, label: 'Маг (магия/хрупкий)',      classes: [7, 8, 9] },
  { id: 4, label: 'Гном (защита/HP)',         classes: [10, 11, 12] },
  { id: 5, label: 'Дракониды (HP/огонь)',     classes: [13, 14, 15] },
  { id: 6, label: 'Рояль (универсал)',        classes: [16, 17, 18] },
];

// ---- command-list builder ----
const L = [];
const cmd = (code, indent, parameters = []) => L.push({ code, indent, parameters });
const wrapText = (lines, max = 30) => { const out = [];
  for (const ln of lines) { if (ln.length <= max) { out.push(ln); continue; }
    let cur = ''; for (const w of ln.split(' ')) {
      if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w; }
      else cur = (cur ? cur + ' ' : '') + w; } if (cur) out.push(cur); }
  return out; };
const text = (indent, lines, face = '', faceIdx = 0) => {
  cmd(101, indent, [face, faceIdx, 0, 2]);
  for (const ln of wrapText(lines)) cmd(401, indent, [ln]);
};
const setVar = (indent, id, val) => cmd(122, indent, [id, id, 0, 0, val]);
const script = (indent, code) => {
  const lines = code.split('\n');
  cmd(355, indent, [lines[0]]);
  for (let i = 1; i < lines.length; i++) cmd(655, indent, [lines[i]]);
};

// short race gimmick shown right after picking a race
const DESC = {
  1: 'Варвар: HP×2, сила×1.8, магия слабая. Стойкость к безумию.',
  2: 'Эльф: ловкость и магия, HP мало. Высокое уклонение.',
  3: 'Маг: магия×2.2, очень хрупкий. Заклинания дешевле.',
  4: 'Гном: защита и HP, медлителен. Меньше физ. урона.',
  5: 'Дракониды: HP и сила, огнестойкость, заряды ярости.',
  6: 'Рояль: всё ровно-высокое, +20% опыта.',
};

// detailed per-class info shown on hover. Навыки заданы статически (learnings к моменту
// gen_phase5 ещё пустые — их пишет gen_phase11 позже); оружие читается из Classes.json.
const WT = {1:'кинжал',2:'меч',3:'цеп',4:'топор',5:'хлыст',6:'посох',7:'лук',8:'арбалет',9:'огнестрел',10:'когти',11:'кастет',12:'копьё'};
const ARCH = {1:'яростный дамагер ближнего боя',2:'защитник-танк',3:'универсал (бой+магия)',4:'маг поддержки',
  5:'ловкий стрелок',6:'быстрый боец уклонения',7:'чистый боевой маг',8:'тёмный маг по площади',9:'живучий маг времени',
  10:'защитный боевой маг',11:'тяжёлый танк',12:'взрывной дамагер',13:'кровавый танк',14:'могучий страж',
  15:'дамагер-проклятийник',16:'святой танк',17:'скоростной критовик',18:'гибрид меча и магии'};
const SFOCUS = {1:'ATK/скорость',2:'HP/защита',3:'всё ровно',4:'магия/мана',5:'ловкость/ATK',6:'скорость/уклон',
  7:'магия/мана',8:'магия',9:'магия/MDF',10:'защита/HP/магия',11:'HP/защита',12:'ATK/магия',13:'HP/защита',
  14:'HP/сила/защита',15:'ATK/магия',16:'HP/защита',17:'скорость/удача',18:'ATK/магия'};
const SIG = {1:'Берсерк-раш',2:'Удар щитом',3:'Духовный залп',4:'Зов духов',5:'Лунный выстрел',6:'Шквал клинков',
  7:'Чародейский залп',8:'Тёмная длань',9:'Темпоразрыв',10:'Рунный взрыв',11:'Сейсмоудар',12:'Бомба',
  13:'Кровавая жатва',14:'Первобытный рёв',15:'Печать гибели',16:'Свет правосудия',17:'Удар из тени',18:'Арканный клинок'};
const ULT = {bar:['Сокрушающий удар','Кровавая ярость','Гнев предков'],elf:['Лунная стрела','Танец клинков','Гнев духов'],
  mag:['Ледяная игла','Цепная молния','Метеор'],gno:['Рунный щит','Сокрушение земли','Несокрушимость'],
  dra:['Огненное дыхание','Драконий коготь','Пламя древних'],roy:['Святой удар','Королевский гнев','Длань короля']};
const ultOf = cid => cid<=3?ULT.bar:cid<=6?ULT.elf:cid<=9?ULT.mag:cid<=12?ULT.gno:cid<=15?ULT.dra:ULT.roy;
const SPELLS = {1:['Боевой клич','Проклятие'],2:['Щит','Боевой клич'],3:['Регенерация','Яд'],4:['Регенерация','Очищение','Поджог'],
  5:['Боевой клич','Яд'],6:['Боевой клич','Яд'],7:['Магический щит','Поджог','Проклятие'],8:['Магический щит','Яд','Проклятие'],
  9:['Магический щит','Регенерация','Очищение'],10:['Щит','Регенерация'],11:['Щит','Боевой клич'],12:['Поджог','Яд'],
  13:['Боевой клич','Проклятие'],14:['Щит','Боевой клич'],15:['Поджог','Проклятие'],16:['Щит','Регенерация','Очищение'],
  17:['Яд','Проклятие'],18:['Щит','Поджог','Магический щит']};
function classInfo(cid) {
  const wp = classes[cid].traits.filter(t => t.code===51).map(t => WT[t.dataId]).filter(Boolean);
  return [
    `${className(cid)} — ${ARCH[cid]}.`,
    `Упор: ${SFOCUS[cid]}. Оружие: ${wp.join('/')}.`,
    `Класс-навык: ${SIG[cid]} (с 1 ур.).`,
    `Ульты (1/8/16 ур.): ${ultOf(cid).join(' / ')}.`,
    `Заклинания: ${SPELLS[cid].join(', ')}.`,
  ].join('\n');
}

// ---- intro ----
text(0, ['Чужое тело. Чужой мир.', 'Кем ты очнёшься?']);

// ---- race + class selection: a plain list; the look changes on HOVER (ClassPreview) ----
cmd(118, 0, ['rsel']);
script(0, '$gameTemp._classPreview = null; $gameTemp._classInfo = null;');   // race options: no preview
cmd(102, 0, [RACES.map(r => r.label), -1, 0, 2, 0]);    // race choice (Esc disabled)
RACES.forEach((r, ri) => {
  cmd(402, 0, [ri, r.label]);
  setVar(1, 1, r.id);                                   // Variable 1 = Race
  text(1, [DESC[r.id]]);                                // race gimmick
  const prev = r.classes.map(cid => { const sh = cid <= 8 ? 'Actor1' : cid <= 16 ? 'Actor2' : 'Actor3'; return `['${sh}',${(cid - 1) % 8}]`; }).join(',');
  script(1, `$gameTemp._classPreview = [${prev}];`);    // hover these classes -> live look
  const infos = r.classes.map(cid => JSON.stringify(classInfo(cid))).join(',');
  script(1, `$gameTemp._classInfo = [${infos}];`);       // hover -> detailed class description
  const labels = r.classes.map(className).concat(['◄ Назад к расам']);
  cmd(102, 1, [labels, 3, 0, 2, 0]);                    // cancel -> «Назад» (index 3)
  r.classes.forEach((cid, ci) => {
    cmd(402, 1, [ci, labels[ci]]);
    setVar(2, 2, cid);                                  // Variable 2 = Class
    cmd(321, 2, [1, cid, true]);                        // Change Class (keep level)
    const sh = cid <= 8 ? 'Actor1' : cid <= 16 ? 'Actor2' : 'Actor3', ix = (cid - 1) % 8;
    cmd(322, 2, [1, sh, ix, sh, ix, '']);               // lock in the look
  });
  cmd(402, 1, [3, '◄ Назад к расам']);                  // back option (also Esc)
  cmd(119, 2, ['rsel']);
  cmd(404, 1);
});
cmd(404, 0);
script(0, '$gameTemp._classPreview = null; $gameTemp._classInfo = null;');   // done -> clear preview

// ---- tail (runs once) ----
cmd(121, 0, [1, 1, 0]);                                 // Switch 1 = ON (game started)
setVar(0, 10, 0); setVar(0, 11, 0); setVar(0, 12, 100); // survival: Hunger/Fatigue 0, Sanity 100
setVar(0, 5, 1);                                        // deepest labyrinth floor reached = 1

// starter kit (Phase 3 items). Weapons 1,2,4,6,11 cover every class's weapon type.
cmd(125, 0, [0, 0, 500]);                               // +500 gold
[[1,3],[5,2],[7,1],[9,2],[11,1],[13,1]].forEach(([id,q]) => cmd(126, 0, [id, 0, 0, q]));   // items (incl. 2 torches)
[1,2,4,6,11].forEach(id => cmd(127, 0, [id, 0, 0, 1, false]));                        // weapons
[6,10].forEach(id => cmd(128, 0, [id, 0, 0, 1, false]));                              // armor: Дорожная одежда, Кольцо силы
script(0, [
  "var a = $gameActors.actor(1);",
  "a._skills = [];",                                     // wipe any accumulated skills (no class mixing)
  "a.currentClass().learnings.forEach(function(l){ if (l.level <= a.level) a.learnSkill(l.skillId); });", // only the chosen class
  "a._passiveStatesRaw = undefined;",                   // bust AutoPassiveStates cache
  "a.refresh();",
  "a.recoverAll();",
  "a.learnSkill(29); a.learnSkill(30); a.learnSkill(31);", // called shots (body-part targeting)
  "a.learnSkill([0,32,33,34,35,36,37][$gameVariables.value(1)]); // racial signature skill",
  "$gameVariables.setValue(24, $gameVariables.value(1) === 1 ? 6 : 4);", // essence slots
  "var rn = ['','Варвар','Эльф/Фея','Маг','Гном','Дракониды','Королевский народ'];",
  "$gameVariables.setValue(94, rn[$gameVariables.value(1)]);",
  "$gameVariables.setValue(95, $dataClasses[$gameVariables.value(2)].name);",
  "$gameVariables.setValue(90, a.mhp);",
  "$gameVariables.setValue(91, a.param(2));",
  "$gameVariables.setValue(92, a.param(4));",
  "$gameVariables.setValue(93, a.param(6));",
].join('\n'));
text(0, [
  'Раса: \\V[94]   Класс: \\V[95]',
  'HP \\V[90]   ATK \\V[91]',
  'MAG \\V[92]   AGI \\V[93]',
  'Слотов эссенций: \\V[24]',
]);
text(0, ['Ты делаешь шаг — и оказываешься у ворот Рафдонии.']);
cmd(201, 0, [0, 2, 20, 33, 8, 0]);                      // transfer to Рафдония (Map002), at the gate
cmd(0, 0);                                              // list terminator

// ---- write CommonEvent 1 ----
const ce = read('CommonEvents');
ce[1] = { id: 1, list: L, name: 'Создание персонажа', switchId: 1, trigger: 0 };
write('CommonEvents', ce);

// ---- Map001: a clean dark "awakening" chamber, only the creation autorun ----
const blankImage = { tileId: 0, characterName: '', direction: 2, pattern: 1, characterIndex: 0 };
const blankRoute = { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false };
const cond = over => ({ actorId: 1, actorValid: false, itemId: 1, itemValid: false,
  selfSwitchCh: 'A', selfSwitchValid: false, switch1Id: 1, switch1Valid: over,
  switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 });
const pageBase = (trigger, list, conditions) => ({
  conditions, directionFix: false, image: blankImage, list,
  moveFrequency: 3, moveRoute: blankRoute, moveSpeed: 3, moveType: 0,
  priorityType: 0, stepAnime: false, through: false, trigger, walkAnime: true,
});
const map = read('Map001');
map.displayName = ''; map.tilesetId = 4;            // Dungeon tileset, nameless void
map.autoplayBgm = true; map.bgm = { name: 'Dungeon3', pan: 0, pitch: 100, volume: 70 };
const W = map.width, H = map.height;
map.data = new Array(W * H * 6).fill(0);
fillLayer(map, 0, 2048 + 26 * 48);                  // dark cobble floor (Dungeon kind26)
wallRect(map, 0, 0, W, 1, 87, 1); wallRect(map, 0, H - 1, W, 1, 87, 1);
wallRect(map, 0, 0, 1, H, 87, 1); wallRect(map, W - 1, 0, 1, H, 87, 1);
map.events = [null, {                               // ONLY the creation event
  id: 1, name: 'CharCreate', note: '', x: 0, y: 0,
  pages: [
    pageBase(3, [{ code: 117, indent: 0, parameters: [1] }, { code: 0, indent: 0, parameters: [] }], cond(false)),
    pageBase(0, [{ code: 0, indent: 0, parameters: [] }], cond(true)),
  ],
}];
write('Map001', map);

console.error('CommonEvent 1 list commands:', L.length);
console.error('Map001 event 1 pages:', map.events[1].pages.length);
