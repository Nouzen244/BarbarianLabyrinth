// PHASE 2 — Races (param-rate passive states), 18 specialization Classes,
// and universal condition states. Re-runnable / idempotent.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

// ---------- trait helpers ----------
const T = {
  param: (id, rate) => ({ code: 21, dataId: id, value: rate }),   // MHP MMP ATK DEF MAT MDF AGI LUK = 0..7
  xparam: (id, v) => ({ code: 22, dataId: id, value: v }),         // hit eva cri cev mev mrf cnt hrg mrg trg = 0..9
  sparam: (id, v) => ({ code: 23, dataId: id, value: v }),         // tgr grd rec pha mcr tcr pdr mdr fdr exr = 0..9
  element: (id, rate) => ({ code: 11, dataId: id, value: rate }),  // element id
  stateResist: id => ({ code: 14, dataId: id, value: 0 }),
  addSkillType: id => ({ code: 41, dataId: id, value: 0 }),        // 1 Magic, 2 Special
  weapon: id => ({ code: 51, dataId: id, value: 0 }),              // weaponTypes index
  armor: id => ({ code: 52, dataId: id, value: 0 }),               // armorTypes index
  attackTimes: n => ({ code: 61, dataId: 0, value: n }),
};
const P = { MHP:0, MMP:1, ATK:2, DEF:3, MAT:4, MDF:5, AGI:6, LUK:7 };

// ============================================================
// 1) RACES  ->  passive states (ids 11..16), auto-applied by Variable 1
// ============================================================
// multipliers [MHP,MMP,ATK,DEF,MAT,MDF,AGI,LUK]
const RACES = [
  { id: 11, raceVar: 1, name: 'Раса: Варвар',          icon: 84,
    mult: [2.00,0.60,1.80,1.20,0.40,0.80,1.00,1.00],
    extra: [T.xparam(7,0.03), T.stateResist(8)],            // +HP regen, immune to Confusion (wild fury)
    desc: 'HP×200% ATK×180% MAG×40%. Печать духа: стойкость к рассудку.' },
  { id: 12, raceVar: 2, name: 'Раса: Эльф/Фея',         icon: 79,
    mult: [0.90,1.40,0.90,0.90,1.50,1.10,1.70,1.10],
    extra: [T.xparam(1,0.10), T.element(7,0.85)],           // +EVA, wind affinity
    desc: 'AGI×170% MAG×150% HP×90%. Договор духов.' },
  { id: 13, raceVar: 3, name: 'Раса: Маг',              icon: 78,
    mult: [1.05,2.00,0.60,1.00,2.20,1.50,1.00,1.00],
    extra: [T.xparam(8,0.05), T.sparam(4,0.90), T.sparam(6,0.88)],  // +MP regen, -10% MP cost, -12% physical damage taken
    desc: 'MAG×220% HP×105% MDF×150% STR×60%. Резонанс + барьер плоти.' },
  { id: 14, raceVar: 4, name: 'Раса: Гном',             icon: 81,
    mult: [1.60,1.00,1.20,1.50,0.90,1.60,0.60,1.00],
    extra: [T.sparam(6,0.85)],                              // -15% physical damage taken
    desc: 'RES×160% HP×160% AGI×60%. Рунная ковка.' },
  { id: 15, raceVar: 5, name: 'Раса: Дракониды',        icon: 64,
    mult: [1.70,0.90,1.50,1.30,1.00,1.10,0.80,1.00],
    extra: [T.element(2,0.50), T.xparam(9,0.10)],           // fire resist, +TP regen (rage charges)
    desc: 'HP×170% STR×150% AGI×80%. Драконья кровь.' },
  { id: 16, raceVar: 6, name: 'Раса: Королевский народ', icon: 87,
    mult: [1.20,1.20,1.15,1.15,1.15,1.15,1.15,1.20],
    extra: [T.sparam(9,1.20)],                              // +20% EXP (royal learning)
    desc: 'Всё среднее-высокое. Королевская печать.' },
];

function raceState(r) {
  const traits = [];
  for (let i = 0; i < 8; i++) if (r.mult[i] !== 1.0) traits.push(T.param(i, r.mult[i]));
  traits.push(...r.extra);
  return {
    id: r.id, autoRemovalTiming: 0, chanceByDamage: 100, iconIndex: r.icon,
    maxTurns: 1, minTurns: 1, motion: 0, overlay: 0, priority: 0,
    message1: '', message2: '', message3: '', message4: '',
    releaseByDamage: false, removeAtBattleEnd: false, removeByDamage: false,
    removeByRestriction: false, removeByWalking: false, restriction: 0,
    stepsToRemove: 100,
    note: `${r.desc}\n<Custom Passive Condition>\ncondition = v[1] === ${r.raceVar};\n</Custom Passive Condition>`,
    name: r.name, traits,
  };
}

// ============================================================
// 2) CONDITION STATES (ids 17..21) — survival / injury
// ============================================================
function condState(o) {
  return Object.assign({
    id: 0, autoRemovalTiming: 0, chanceByDamage: 100, iconIndex: 0,
    maxTurns: 1, minTurns: 1, motion: 1, overlay: 0, priority: 50,
    message1: '', message2: '', message3: '', message4: '',
    releaseByDamage: false, removeAtBattleEnd: false, removeByDamage: false,
    removeByRestriction: false, removeByWalking: false, restriction: 0,
    stepsToRemove: 100, note: '', name: '', traits: [],
  }, o);
}
const CONDITIONS = [
  condState({ id: 17, name: 'Сломана рука', iconIndex: 12,
    message1: ' ломает руку!', message4: ' срастил руку.',
    traits: [T.param(P.ATK, 0.5)], note: 'ATK -50%. Снимается лечением переломов.' }),
  condState({ id: 18, name: 'Сломана нога', iconIndex: 13,
    message1: ' ломает ногу!', message4: ' срастил ногу.',
    traits: [T.param(P.AGI, 0.5), T.param(P.DEF, 0.85)], note: 'AGI -50%, DEF -15%.' }),
  condState({ id: 19, name: 'Голод', iconIndex: 9,
    message1: ' умирает с голоду!', message4: ' больше не голоден.',
    traits: [T.xparam(7, -0.05), T.param(P.ATK, 0.85)], note: 'При Голоде=100. HP -5%/ход, ATK -15%.' }),
  condState({ id: 20, name: 'Истощение', iconIndex: 8,
    message1: ' валится с ног от усталости!', message4: ' отдохнул.',
    traits: [T.param(P.AGI, 0.5), T.xparam(0, -0.20)], note: 'При Усталости=100. AGI -50%, точность -20%.' }),
  condState({ id: 21, name: 'Потеря рассудка', iconIndex: 6,
    message1: ' теряет контроль над собой!', message4: ' приходит в себя.',
    restriction: 2, traits: [], note: 'При Рассудке=0. Персонаж атакует случайные цели.' }),
];

// ============================================================
// 3) CLASSES (ids 1..18) — specializations, role-weighted curves
// ============================================================
const BASE = { // [base@lv1, growthPerLevel]
  MHP:[120,24], MMP:[40,7], ATK:[16,3.0], DEF:[14,2.6],
  MAT:[16,3.0], MDF:[14,2.6], AGI:[15,2.4], LUK:[12,2.0],
};
const ORDER = ['MHP','MMP','ATK','DEF','MAT','MDF','AGI','LUK'];
function curve(weight, key) {
  const [b, g] = BASE[key];
  const arr = new Array(100).fill(0);
  for (let lv = 1; lv <= 99; lv++) arr[lv] = Math.max(1, Math.round((b + g * (lv - 1)) * weight));
  arr[0] = arr[1];
  return arr;
}
// weights [MHP,MMP,ATK,DEF,MAT,MDF,AGI,LUK], st = skill types, wp = weapon types, ar = armor types
const CLASSES = [
  { id:1,  name:'Берсеркер',         w:[1.10,0.6,1.30,0.95,0.50,0.80,1.20,1.00], st:[2],   wp:[2,3,4],    ar:[1,3] },
  { id:2,  name:'Вождь-страж',       w:[1.30,0.7,1.00,1.30,0.60,1.10,0.85,1.00], st:[2],   wp:[2,4,12],   ar:[1,4,5,6] },
  { id:3,  name:'Охотник духов',     w:[1.05,1.0,1.05,0.95,1.10,1.00,1.05,1.10], st:[1,2], wp:[1,2,7],    ar:[1,3] },
  { id:4,  name:'Духозаклинатель',   w:[0.85,1.4,0.70,0.85,1.35,1.15,1.05,1.05], st:[1,2], wp:[6,1],      ar:[1,2,3] },
  { id:5,  name:'Лунный стрелок',    w:[0.90,1.0,1.15,0.90,0.95,0.95,1.30,1.10], st:[1,2], wp:[7,8,1,2],  ar:[1,3] },
  { id:6,  name:'Танцор клинков',    w:[0.90,0.9,1.20,0.90,0.80,0.90,1.35,1.10], st:[2],   wp:[1,2,10],   ar:[1,3] },
  { id:7,  name:'Архимаг',           w:[0.80,1.5,0.60,0.80,1.50,1.20,1.00,1.00], st:[1,2], wp:[6],        ar:[1,2] },
  { id:8,  name:'Некромант',         w:[0.85,1.4,0.70,0.85,1.40,1.10,0.95,1.05], st:[1,2], wp:[6,1],      ar:[1,2] },
  { id:9,  name:'Хронист',           w:[0.90,1.3,0.65,1.00,1.25,1.30,1.00,1.10], st:[1,2], wp:[6],        ar:[1,2,3] },
  { id:10, name:'Рунный кузнец',     w:[1.10,1.1,0.95,1.20,1.10,1.15,0.85,1.00], st:[1,2], wp:[3,4,11],   ar:[1,4,5] },
  { id:11, name:'Страж-разрушитель', w:[1.30,0.8,1.10,1.30,0.70,1.15,0.80,1.00], st:[2],   wp:[3,4,12],   ar:[1,4,5,6] },
  { id:12, name:'Подрывник',         w:[1.00,1.1,1.15,0.95,1.15,0.95,1.00,1.05], st:[1,2], wp:[9,11],     ar:[1,3] },
  { id:13, name:'Хранитель крови',   w:[1.25,0.9,1.05,1.25,0.95,1.10,0.85,1.00], st:[1,2], wp:[2,4,12],   ar:[1,4,5] },
  { id:14, name:'Первородный страж', w:[1.30,0.8,1.20,1.20,0.85,1.05,0.85,1.00], st:[2],   wp:[2,4,12],   ar:[1,4,6] },
  { id:15, name:'Вестник гибели',    w:[1.05,1.0,1.25,0.95,1.15,0.95,1.00,1.00], st:[1,2], wp:[2,4,10],   ar:[1,3,4] },
  { id:16, name:'Паладин-инквизитор',w:[1.20,1.0,1.15,1.20,1.05,1.15,0.90,1.05], st:[1,2], wp:[2,4,12],   ar:[1,4,5,6] },
  { id:17, name:'Дипломат-убийца',   w:[0.95,0.9,1.15,0.90,0.90,0.95,1.25,1.25], st:[2],   wp:[1,10,9],   ar:[1,3] },
  { id:18, name:'Арканный рыцарь',   w:[1.05,1.1,1.15,1.05,1.20,1.05,1.00,1.05], st:[1,2], wp:[2,6,12],   ar:[1,2,4] },
];
function buildClass(c) {
  const params = ORDER.map(k => curve(c.w[P[k]], k));
  const traits = [];
  for (const s of c.st) traits.push(T.addSkillType(s));
  for (const w of c.wp) traits.push(T.weapon(w));
  for (const a of c.ar) traits.push(T.armor(a));
  traits.push(T.sparam(0, 1.0)); // tgr baseline
  traits.push(T.xparam(0, 0.95)); // HIT 95% (MV base hit is 0 — without this all phys attacks miss)
  traits.push(T.xparam(2, 0.04)); // CRI 4%
  traits.push(T.xparam(8, 0.07)); // MP regen 7%/ход (мана сама восстанавливается в бою)
  return { id: c.id, expParams: [30,20,30,30], traits, learnings: [], name: c.name, note: '', params };
}

// ============================================================
// WRITE OUT
// ============================================================
// Classes — full replace
const classes = [null, ...CLASSES.map(buildClass)];
write('Classes', classes);

// States — keep engine states 1..10, set 11..21
const states = read('States');
while (states.length < 22) states.push(null);
for (const r of RACES) states[r.id] = raceState(r);
for (const c of CONDITIONS) states[c.id] = c;
write('States', states);

// Actor 1 = protagonist: enable all race passives, set defaults
const actors = read('Actors');
const a1 = actors[1];
a1.name = 'Бьёрн';
a1.nickname = 'Варвар';
a1.classId = 1;
a1.initialLevel = 1;
a1.maxLevel = 99;
a1.equips = [0,0,0,0,0];
a1.note = '<Passive State: 11 to 16>';
write('Actors', actors);

// System — solo start party
const sys = read('System');
sys.partyMembers = [1];
write('System', sys);

console.error('Classes:', classes.length - 1, '| States set: 11-21 | Actor 1 ->', a1.name, '| party:', JSON.stringify(sys.partyMembers));
console.error('Sample: Берсеркер MHP@1/50/99 =', classes[1].params[0][1], classes[1].params[0][50], classes[1].params[0][99]);
