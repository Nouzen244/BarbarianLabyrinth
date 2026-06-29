// PHASE 11 — Racial ultimate skills (T1/T2/T3) learned at levels 5/15/30.
// Skills ids 11-28 (3 per race); learnings added to each race's 3 classes.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

// element ids: 1 phys 2 fire 3 ice 4 thunder 5 water 6 earth 7 wind 8 light 9 dark
function skill(id, name, o) {
  return {
    id, animationId: o.anim ?? 1,
    damage: { critical: o.crit ?? false, elementId: o.elem ?? 1, formula: o.formula, type: o.type ?? 1, variance: 20 },
    description: o.desc ?? '', effects: o.effects ?? [], hitType: o.hit ?? 1, iconIndex: o.icon ?? 76,
    message1: ' применяет %1!', message2: '', mpCost: o.mp ?? 0, name, note: o.note ?? '', occasion: 1,
    repeats: o.repeats ?? 1, requiredWtypeId1: 0, requiredWtypeId2: 0, scope: o.scope ?? 1,
    speed: 0, stypeId: 2, successRate: 100, tpCost: o.tp ?? 0, tpGain: 10,
  };
}
const ONE = 1, ALL = 2, SELF = 11, DMG = 1, HEAL = 3, PHYS = 1, MAG = 2, CERT = 0;

const SKILLS = {
  // Варвар (classes 1-3)
  11: skill(11, 'Сокрушающий удар', { mp: 8,  scope: ONE, hit: PHYS, elem: 1, formula: 'a.atk*2.5 - b.def', icon: 76, desc: 'T1: мощный физический удар.' }),
  12: skill(12, 'Кровавая ярость',  { mp: 16, scope: ALL, hit: PHYS, elem: 1, formula: 'a.atk*2 - b.def*0.5', icon: 76, desc: 'T2: удар по всем врагам.' }),
  13: skill(13, 'Гнев предков',     { mp: 30, scope: ONE, hit: PHYS, elem: 1, formula: 'a.atk*4 - b.def', icon: 77, desc: 'T3: сокрушительный удар.' }),
  // Эльф (4-6)
  14: skill(14, 'Лунная стрела',    { mp: 8,  scope: ONE, hit: MAG, elem: 8, formula: 'a.mat*2 + a.agi - b.mdf', anim: 78, icon: 72, desc: 'T1: свет и ловкость.' }),
  15: skill(15, 'Танец клинков',    { mp: 16, scope: ONE, hit: PHYS, elem: 1, formula: 'a.agi*1.6 - b.def', repeats: 3, icon: 76, desc: 'T2: три быстрых удара.' }),
  16: skill(16, 'Гнев духов',       { mp: 30, scope: ALL, hit: MAG, elem: 7, formula: 'a.mat*2.5 - b.mdf', anim: 79, icon: 71, desc: 'T3: буря по всем врагам.' }),
  // Маг (7-9)
  17: skill(17, 'Ледяная игла',     { mp: 8,  scope: ONE, hit: MAG, elem: 3, formula: 'a.mat*2.5 - b.mdf', anim: 67, icon: 65, desc: 'T1: ледяной снаряд.' }),
  18: skill(18, 'Цепная молния',    { mp: 18, scope: ALL, hit: MAG, elem: 4, formula: 'a.mat*2 - b.mdf', anim: 76, icon: 66, desc: 'T2: молния по всем.' }),
  19: skill(19, 'Метеор',           { mp: 34, scope: ALL, hit: MAG, elem: 2, formula: 'a.mat*3.5 - b.mdf', anim: 66, icon: 64, desc: 'T3: метеоритный дождь.' }),
  // Гном (10-12)
  20: skill(20, 'Рунный щит',       { mp: 8,  scope: SELF, type: HEAL, hit: CERT, formula: 'a.def*3 + 100', icon: 81, desc: 'T1: руны лечат носителя.' }),
  21: skill(21, 'Сокрушение земли', { mp: 18, scope: ALL, hit: PHYS, elem: 6, formula: 'a.atk + a.def - b.def', anim: 1, icon: 68, desc: 'T2: удар земли по всем.' }),
  22: skill(22, 'Несокрушимость',   { mp: 30, scope: SELF, type: HEAL, hit: CERT, formula: 'a.mhp*0.5', icon: 81, desc: 'T3: восстановить половину HP.' }),
  // Дракониды (13-15)
  23: skill(23, 'Огненное дыхание', { mp: 10, scope: ALL, hit: MAG, elem: 2, formula: 'a.atk + a.mat - b.mdf', anim: 66, icon: 64, desc: 'T1: пламя по всем врагам.' }),
  24: skill(24, 'Драконий коготь',  { mp: 16, scope: ONE, hit: PHYS, elem: 2, formula: 'a.atk*3 - b.def', icon: 76, desc: 'T2: огненный коготь.' }),
  25: skill(25, 'Пламя древних',    { mp: 34, scope: ALL, hit: MAG, elem: 2, formula: 'a.atk*2 + a.mat*2 - b.mdf', anim: 66, icon: 64, desc: 'T3: испепеляющее пламя.' }),
  // Рояль (16-18)
  26: skill(26, 'Святой удар',      { mp: 10, scope: ONE, hit: CERT, elem: 8, formula: 'a.atk*1.5 + a.mat*1.5 - b.mdf', anim: 78, icon: 72, desc: 'T1: точный святой удар.' }),
  27: skill(27, 'Королевский гнев', { mp: 20, scope: ALL, hit: MAG, elem: 8, formula: 'a.mat*2.2 - b.mdf', anim: 78, icon: 72, desc: 'T2: свет по всем врагам.' }),
  28: skill(28, 'Длань короля',     { mp: 36, scope: ALL, hit: MAG, elem: 8, formula: 'a.atk*2 + a.mat*2 - b.mdf', anim: 78, icon: 73, desc: 'T3: божественная кара.' }),
  // ---- called shots (body-part targeting), learned by everyone at creation ----
  29: skill(29, 'Удар по руке',   { mp: 6, scope: ONE, hit: PHYS, elem: 1, formula: 'a.atk*1.6 - b.def', icon: 76, desc: 'Прицел в руку: шанс перелома (−ATK врага).', effects: [{ code: 21, dataId: 17, value1: 0.6, value2: 0 }] }),
  30: skill(30, 'Удар по ноге',   { mp: 6, scope: ONE, hit: PHYS, elem: 1, formula: 'a.atk*1.6 - b.def', icon: 76, desc: 'Прицел в ногу: шанс перелома (−AGI врага).', effects: [{ code: 21, dataId: 18, value1: 0.6, value2: 0 }] }),
  31: skill(31, 'Удар по голове', { mp: 8, scope: ONE, hit: PHYS, elem: 1, formula: 'a.atk*1.4 - b.def', icon: 77, desc: 'Прицел в голову: шанс ослепить врага.', effects: [{ code: 21, dataId: 5, value1: 0.5, value2: 0 }] }),
};

const skills = read('Skills');
while (skills.length < 75) skills.push(null);
for (const id in SKILLS) skills[id] = SKILLS[id];

// ---- racial signature skills (32-37, one per race) + stat lines on combat skills ----
// (runs here, the last Skills writer, so descriptions aren't overwritten)
const ELname = {1:'физ.',2:'огонь',3:'лёд',4:'молния',5:'вода',6:'земля',7:'ветер',8:'свет',9:'тьма'};
const HTname = {0:'точный',1:'физ.',2:'маг.'};
const friendly = f => f.replace(/a\.atk\*([\d.]+)/g,'$1×ATK').replace(/a\.mat\*([\d.]+)/g,'$1×MAG')
  .replace(/a\.agi\*([\d.]+)/g,'$1×AGI').replace(/a\.def\*([\d.]+)/g,'$1×DEF')
  .replace(/\s*-\s*b\.(def|mdf)/g,'').replace(/\s*\+\s*/g,'+').trim();
const statDesc = (d,ht,scope,mp) => `${friendly(d.formula)} | ${HTname[ht]}${d.elementId>1?'/'+ELname[d.elementId]:''}${d.critical?' | крит':''} | ${scope===2?'все':'1 цель'} | MP${mp}`;
const mkR = (id,name,mp,scope,ht,el,formula,crit,anim,icon) => {
  const d = {critical:crit,elementId:el,formula,type:1,variance:20};
  skills[id] = {id,animationId:anim,damage:d,description:statDesc(d,ht,scope,mp),effects:[],hitType:ht,iconIndex:icon,
    message1:' применяет %1!',message2:'',mpCost:mp,name,note:'',occasion:1,repeats:1,requiredWtypeId1:0,requiredWtypeId2:0,
    scope,speed:0,stypeId:2,successRate:100,tpCost:0,tpGain:10};
};
mkR(32,'Кровавый рёв',   10,1,1,1,'a.atk*2.8 - b.def',            true, 8,76);  // Варвар
mkR(33,'Шквал стрел',     8,2,1,7,'a.atk*1.2 + a.agi*1.2 - b.def',true, 8,77);  // Эльф
mkR(34,'Огненный шторм', 24,2,2,2,'a.mat*2.4 - b.mdf',            false,68,64);  // Маг
mkR(35,'Рунный молот',   12,1,1,6,'a.atk*2.0 + a.def*1.2 - b.def',false,8,76);  // Гном
mkR(36,'Драконье пламя', 18,2,2,2,'a.atk*1.2 + a.mat*1.6 - b.mdf',false,70,66); // Дракониды
mkR(37,'Клинок света',   14,1,1,8,'a.atk*2.2 + a.mat*0.8 - b.mdf',true,78,72);  // Рояль
// talent-tree skills 38-39: damage scales with the actor's node level (a._tree[id])
const lv = id => `(a._tree?(a._tree.${id}||1):1)`;
mkR(38,'Мощный удар', 8,1,1,1,`a.atk*(2 + 0.5*${lv('s_strike')}) - b.def`, true, 8,76);
mkR(39,'Вихрь',      14,2,1,1,`a.atk*(1.0 + 0.3*${lv('s_whirl')}) - b.def`, false,8,77);
// per-class signature skills 40-57 (one per class, learned at level 1)
const DRAIN = 5;
const SIG = {
  1:[40,'Берсерк-раш',     {mp:6, scope:ONE,hit:PHYS,elem:1,formula:'a.atk*2.6 - b.def',crit:true,icon:76}],
  2:[41,'Удар щитом',      {mp:6, scope:ONE,hit:PHYS,elem:1,formula:'a.atk*1.4 + a.def*1.4 - b.def',icon:81}],
  3:[42,'Духовный залп',   {mp:7, scope:ONE,hit:MAG, elem:8,formula:'a.atk + a.mat - b.mdf',anim:78,icon:72}],
  4:[43,'Зов духов',       {mp:10,scope:ALL,hit:MAG, elem:7,formula:'a.mat*1.8 - b.mdf',anim:79,icon:71}],
  5:[44,'Лунный выстрел',  {mp:7, scope:ONE,hit:PHYS,elem:1,formula:'a.atk*1.2 + a.agi*1.4 - b.def',crit:true,icon:77}],
  6:[45,'Шквал клинков',   {mp:10,scope:ONE,hit:PHYS,elem:1,formula:'a.agi*1.5 - b.def',repeats:3,icon:76}],
  7:[46,'Чародейский залп',{mp:9, scope:ONE,hit:MAG, elem:2,formula:'a.mat*2.8 - b.mdf',anim:66,icon:64}],
  8:[47,'Тёмная длань',    {mp:10,scope:ONE,hit:MAG, elem:9,formula:'a.mat*2.6 - b.mdf',anim:101,icon:65}],
  9:[48,'Темпоразрыв',     {mp:9, scope:ALL,hit:MAG, elem:4,formula:'a.mat*1.7 - b.mdf',anim:76,icon:66}],
  10:[49,'Рунный взрыв',   {mp:9, scope:ONE,hit:MAG, elem:6,formula:'a.mat*1.5 + a.def*1.2 - b.mdf',icon:68}],
  11:[50,'Сейсмоудар',     {mp:12,scope:ALL,hit:PHYS,elem:6,formula:'a.atk*1.6 - b.def',anim:1,icon:68}],
  12:[51,'Бомба',          {mp:10,scope:ALL,hit:MAG, elem:2,formula:'a.atk*1.4 + a.mat - b.mdf',anim:68,icon:64}],
  13:[52,'Кровавая жатва', {mp:10,scope:ONE,hit:PHYS,elem:1,formula:'a.atk*2.2 - b.def',type:DRAIN,icon:76}],
  14:[53,'Первобытный рёв',{mp:12,scope:ONE,hit:PHYS,elem:1,formula:'a.atk*3 - b.def',icon:77}],
  15:[54,'Печать гибели',  {mp:14,scope:ONE,hit:MAG, elem:9,formula:'a.atk*1.5 + a.mat*1.5 - b.mdf',anim:101,icon:65}],
  16:[55,'Свет правосудия',{mp:12,scope:ONE,hit:CERT,elem:8,formula:'a.atk*1.5 + a.mat*1.5 - b.mdf',anim:78,icon:72}],
  17:[56,'Удар из тени',   {mp:8, scope:ONE,hit:PHYS,elem:1,formula:'a.atk*2.4 - b.def',crit:true,icon:76}],
  18:[57,'Арканный клинок',{mp:11,scope:ONE,hit:PHYS,elem:1,formula:'a.atk*1.6 + a.mat*1.6 - b.def',icon:76}],
};
const SIG_OF = {};
for (const cid in SIG) { const [sid,name,o]=SIG[cid]; skills[sid]=skill(sid,name,o); SIG_OF[cid]=sid; }

// buff/debuff/support spells 58-64 (apply temporary states 123-129)
const addState = sid => ({code:21,dataId:sid,value1:1,value2:0});
const BUFF = {
  58:['Щит',         {mp:8, scope:SELF,hit:CERT,formula:'0',effects:[],icon:81,desc:'Барьер поверх HP (по DEF) на 2 хода. Растёт с прокачкой.',note:'<Cooldown: 2>\n<CUSTOM USER BARRIER 2 TURNS>\nvalue = 60 + user.def * 3 + (user._skillLv ? (user._skillLv[58]||0) : 0) * user.def;\n</CUSTOM USER BARRIER 2 TURNS>'}],
  59:['Боевой клич', {mp:8, scope:SELF,hit:CERT,formula:'0',effects:[addState(124)],icon:77,desc:'Ярость: ATK +50% на 2 хода. Сильнее с прокачкой.',note:'<Cooldown: 2>'}],
  60:['Регенерация', {mp:10,scope:SELF,hit:CERT,formula:'0',effects:[addState(125)],icon:72,desc:'Восстановление HP 2 хода.',note:'<Cooldown: 2>'}],
  61:['Очищение',    {mp:12,scope:SELF,hit:CERT,formula:'0',effects:[addState(126)],icon:84,desc:'Иммунитет к ядам/ослаблениям.',note:'<Cooldown: 2>'}],
  62:['Яд',          {mp:8, scope:ONE, hit:MAG, elem:9,formula:'a.mat*0.8 - b.mdf',effects:[addState(127)],anim:101,icon:65,desc:'Тёмный урон + отравление.'}],
  63:['Поджог',      {mp:10,scope:ONE, hit:MAG, elem:2,formula:'a.mat*1.0 - b.mdf',effects:[addState(128)],anim:66,icon:64,desc:'Огонь + поджог.'}],
  64:['Проклятие',   {mp:8, scope:ONE, hit:MAG, elem:9,formula:'0',effects:[addState(129)],anim:101,icon:65,desc:'ATK цели −30% на 4 хода. Сильнее с прокачкой.'}],
  // ---- enemy special attacks + self-heal/buff (used by enemy action lists) ----
  65:['Раскол брони',     {mp:0,scope:ONE,hit:PHYS,formula:'a.atk*1.2 - b.def',effects:[addState(130)],icon:81,desc:'Ломает броню: DEF −40% (2 хода).',note:'<Cooldown: 3>'}],
  66:['Оглушающий удар',  {mp:0,scope:ONE,hit:PHYS,formula:'a.atk*1.0 - b.def',effects:[addState(131)],icon:77,desc:'Оглушение (1 ход).',note:'<Cooldown: 4>'}],
  67:['Ослабляющий удар', {mp:0,scope:ONE,hit:PHYS,formula:'a.atk*1.0 - b.def',effects:[addState(132)],icon:76,desc:'Слабость: ATK −10% (2 хода).',note:'<Cooldown: 3>'}],
  68:['Кровавый укус',    {mp:0,scope:ONE,hit:PHYS,formula:'a.atk*1.1 - b.def',effects:[addState(133)],icon:76,desc:'Кровотечение (лечат бинты).',note:'<Cooldown: 3>'}],
  69:['Ядовитый плевок',  {mp:0,scope:ONE,hit:MAG,elem:9,formula:'a.mat*0.8 - b.mdf',effects:[addState(127)],anim:101,icon:65,desc:'Урон + отравление.',note:'<Cooldown: 3>'}],
  70:['Тёмное исцеление', {mp:0,scope:SELF,type:HEAL,hit:CERT,formula:'a.mhp*0.2',icon:72,desc:'Лечит себя на 20% (ход).',note:'<Cooldown: 3>'}],
  71:['Зов Монарха',      {mp:0,scope:SELF,type:HEAL,hit:CERT,formula:'a.mhp*0.5',icon:72,desc:'Босс лечит себя на 50% (1 раз за бой).',note:'<Cooldown: 99>'}],
  72:['Рык ярости',       {mp:0,scope:SELF,hit:CERT,formula:'0',effects:[addState(124)],icon:77,desc:'ATK +50% себе (ход).',note:'<Cooldown: 3>'}],
  73:['Магический щит',   {mp:12,scope:SELF,hit:CERT,formula:'0',effects:[],icon:78,desc:'Барьер поверх HP (по MAG) на 2 хода. Растёт с прокачкой.',note:'<Cooldown: 2>\n<CUSTOM USER BARRIER 2 TURNS>\nvalue = 60 + user.mat * 2 + (user._skillLv ? (user._skillLv[73]||0) : 0) * user.mat;\n</CUSTOM USER BARRIER 2 TURNS>'}],
  74:['Лечащая длань',    {mp:0,scope:7,type:HEAL,hit:CERT,formula:'b.mhp*0.25',icon:72,desc:'Враг лечит союзника на 25%.',note:'<Cooldown: 3>'}],
};
for (const id in BUFF) { const [name,o]=BUFF[id]; skills[Number(id)]=skill(Number(id),name,o); }
// which classes can cast which spells (learned at level 5)
// каждому классу 2-3 тематических заклинания (баффы/дебаффы/щиты)
const CLASS_EXTRA = {
  1:[59,64],    2:[58,59],    3:[60,62],    4:[60,61,63], 5:[59,62],    6:[59,62],
  7:[73,63,64], 8:[73,62,64], 9:[73,60,61], 10:[58,60],   11:[58,59],   12:[63,62],
  13:[59,64],   14:[58,59],   15:[63,64],   16:[58,60,61],17:[62,64],   18:[58,63,73],
};

// add stat lines (урон/тип/крит/цель/MP) to every damaging skill 11-57
for (let id=11; id<=69; id++) { const s=skills[id]; if (!s||!s.damage||!s.damage.formula||!/a\./.test(s.damage.formula)) continue;
  s.description = statDesc(s.damage,s.hitType,s.scope,s.mpCost) + ((id>=29&&id<=31)?' | перелом':''); }
write('Skills', skills);

// race -> [T1,T2,T3] skill ids ; classes per race
const RACE_ULTS = { 1:[11,12,13], 2:[14,15,16], 3:[17,18,19], 4:[20,21,22], 5:[23,24,25], 6:[26,27,28] };
const CLASS_RACE = { 1:1,2:1,3:1, 4:2,5:2,6:2, 7:3,8:3,9:3, 10:4,11:4,12:4, 13:5,14:5,15:5, 16:6,17:6,18:6 };
const LV = [1, 8, 16];   // T1 с 1 уровня → у класса сразу 3 навыка расы (раса-ульт T1 + расовый + классовый сигнатурный)

const classes = read('Classes');
let added = 0;
for (let cid = 1; cid <= 18; cid++) {
  const ults = RACE_ULTS[CLASS_RACE[cid]];
  const c = classes[cid];
  c.learnings = [];   // сбросить дефолтные RTP-навыки (Fire/Heal) — оставляем только наши
  ults.forEach((sk, i) => {
    if (!c.learnings.some(l => l.skillId === sk)) { c.learnings.push({ level: LV[i], skillId: sk, note: '' }); added++; }
  });
  // each class learns its own signature skill at level 1
  const sig = SIG_OF[cid];
  if (sig && !c.learnings.some(l => l.skillId === sig)) { c.learnings.push({ level: 1, skillId: sig, note: '' }); added++; }
  // buff/debuff spells this class can cast (level 1 — доступны сразу)
  (CLASS_EXTRA[cid] || []).forEach(sid => {
    if (!c.learnings.some(l => l.skillId === sid)) { c.learnings.push({ level: 1, skillId: sid, note: '' }); added++; }
  });
  // keep learnings sorted by level (nice in the editor)
  c.learnings.sort((a, b) => a.level - b.level);
}
write('Classes', classes);
console.error('Phase 11: skills 11-28 written; race-ult learnings added:', added);
