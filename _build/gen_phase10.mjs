// PHASE 10 v2 — Labyrinth: 12 themed floors (Map006-017), more enemies/troops,
// treasure chests, visible monsters, scattered decor, bosses every 4th floor,
// a rift, day counter on entry, death-returns-to-town (Labyrinth.js plugin).
import fs from 'node:fs';
import { fillLayer, wallRect, fillRect, setT, savePreview } from './maplib.mjs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));
const A2 = k => 2048 + k * 48;

// ======================= ENEMIES (extend 1-5 with 6-17) =======================
const TIER = { hp:[0,150,380,850,1650], atk:[0,30,55,95,155], def:[0,9,16,26,38],
  mat:[0,16,28,46,72], mdf:[0,8,15,24,34], agi:[0,12,17,24,33], exp:[0,14,34,82,190], gold:[0,18,44,95,210] };
function eStats(tier, role) {
  let [hp,atk,def,mat,mdf,agi] = [TIER.hp[tier],TIER.atk[tier],TIER.def[tier],TIER.mat[tier],TIER.mdf[tier],TIER.agi[tier]];
  if (role==='tank'){ hp=Math.round(hp*1.5); def=Math.round(def*1.3); agi=Math.round(agi*0.7); }
  if (role==='fast'){ agi=Math.round(agi*1.6); hp=Math.round(hp*0.8); }
  if (role==='atk'){ atk=Math.round(atk*1.3); }
  if (role==='mag'){ mat=Math.round(mat*1.7); atk=Math.round(atk*0.6); }
  return [hp,0,atk,def,mat,mdf,agi,Math.round(agi*0.4)+4];
}
function enemy(id,name,battler,tier,role,dropId,denom){
  const actions=[{conditionParam1:0,conditionParam2:0,conditionType:0,rating:5,skillId:1}];
  if (role==='mag') actions.push({conditionParam1:0,conditionParam2:0,conditionType:0,rating:4,skillId:9});
  return { id,name,battlerName:battler,battlerHue:0,actions,role,
    dropItems:[{dataId:dropId,denominator:denom,kind:1},{dataId:1,denominator:5,kind:1}],
    exp:TIER.exp[tier],gold:TIER.gold[tier],params:eStats(tier,role),note:'',
    traits:[{code:22,dataId:0,value:0.95},{code:22,dataId:1,value:0.05},{code:31,dataId:1,value:0}] };
}
const enemies = read('Enemies'); while(enemies.length<81) enemies.push(null);
// keep 1-5 (goblin/rat/skeleton/slime/orc), add 6-17
const NEW = [
  [6,'Летучая мышь','Bat',1,'fast',1,3],   [7,'Пещерная змея','Snake',1,'fast',12,3],
  [8,'Зомби','Zombie',2,'tank',1,4],        [9,'Гигантский паук','Spider',2,'fast',12,3],
  [10,'Оборотень','Werewolf',2,'atk',18,4], [11,'Гаргулья','Gargoyle',3,'tank',2,4],
  [12,'Призрак','Ghost',3,'mag',15,3],      [13,'Демон','Demon',3,'atk',19,4],
  [14,'Химера','Chimera',4,'atk',19,3],     [15,'Цербер','Cerberus',4,'fast',20,2],
  [16,'Бехемот','Behemoth',4,'tank',20,2],  [17,'Дракон','Dragon',4,'atk',20,1],
];
for (const [id,n,b,t,r,d,dn] of NEW) enemies[id]=enemy(id,n,b,t,r,d,dn);
// elite (red aura, passive state 40) + champion (purple aura, passive state 41) variants,
// plus a few fresh base foes for encounter variety
const variant=(id,name,battler,tier,role,drop,denom,st)=>{ const e=enemy(id,name,battler,tier,role,drop,denom); e.note=`<Passive State: ${st}>`; return e; };
enemies[18]=variant(18,'Гаргулья (усил.)','Gargoyle',3,'tank',2,4,40);
enemies[19]=variant(19,'Демон (усил.)','Demon',3,'atk',19,3,40);
enemies[20]=variant(20,'Химера (усил.)','Chimera',4,'atk',19,3,40);
enemies[21]=variant(21,'Демон (элит.)','Demon',4,'atk',19,2,41);
enemies[22]=variant(22,'Дракон (элит.)','Dragon',4,'atk',20,2,41);
enemies[23]=variant(23,'Химера (элит.)','Chimera',4,'atk',20,2,41);
enemies[24]=enemy(24,'Минотавр','Minotaur',3,'atk',2,4);
enemies[25]=enemy(25,'Вампир','Vampire',3,'mag',17,3);
enemies[26]=enemy(26,'Огр','Ogre',2,'tank',1,4);
// hard-boss monarchs (passive state 42 = 3x HP, hard hits); used by HARD troops
enemies[27]=variant(27,'Цербер-Монарх','Cerberus',4,'fast',20,1,42);
enemies[28]=variant(28,'Бехемот-Монарх','Behemoth',4,'tank',20,1,42);
enemies[29]=variant(29,'Дракон-Монарх','Dragon',4,'atk',20,1,42);
enemies[30]=variant(30,'Гаруда-Монарх','Garuda',4,'atk',20,1,42);
enemies[31]=variant(31,'Владыка Бездны','Darklord-final',4,'atk',20,1,42);
// ===== big bestiary: 35 more distinct foes, themed per zone (encounter variety) =====
const NEW2 = [
  // Zone 1 — Пещеры (tier1)
  [32,'Шершень','Hornet',1,'fast',12,3],        [33,'Бес','Imp',1,'atk',11,3],
  [34,'Кокатрис','Cockatrice',1,'fast',11,3],    [35,'Блуждающий огонёк','Willowisp',1,'mag',13,3],
  [36,'Плотоядный цветок','Plant',1,'tank',12,4],[37,'Пещерный скорпион','Scorpion',1,'atk',12,3],
  [38,'Мимик','Mimic',1,'tank',1,3],
  // Zone 2 — Склеп (tier2)
  [39,'Ламия','Lamia',2,'mag',15,3],             [40,'Гадающий глаз','Gazer',2,'mag',16,3],
  [41,'Марионетка','Puppet',2,'fast',15,4],       [42,'Сахуагин','Sahuagin',2,'atk',16,3],
  [43,'Тёмный маг','Mage',2,'mag',16,3],          [44,'Разбойник','Rogue',2,'fast',2,3],
  [45,'Убийца','Assassin',2,'fast',2,3],
  // Zone 3 — Пекло (tier3)
  [46,'Дух пламени','Firespirit',3,'mag',13,3],   [47,'Фанатик','Fanatic',3,'mag',17,3],
  [48,'Латник','Soldier',3,'tank',2,4],           [49,'Капитан','Captain',3,'atk',17,3],
  [50,'Адский бес','Imp',3,'atk',13,3],           [51,'Песчаный скорпион','Scorpion',3,'atk',17,3],
  [52,'Обсидиановый страж','Gargoyle',3,'tank',2,4],
  // Zone 4 — Мерзлота (tier3)
  [53,'Дух воды','Waterspirit',3,'mag',15,3],     [54,'Дух ветра','Windspirit',3,'fast',16,3],
  [55,'Дух земли','Earthspirit',3,'tank',2,4],     [56,'Ледяная медуза','Jellyfish',3,'mag',15,3],
  [57,'Фея','Fairy',3,'fast',16,3],               [58,'Суккуб','Succubus',3,'mag',17,3],
  [59,'Гаруда','Garuda',3,'fast',18,3],
  // Zone 5 — Бездна (tier4)
  [60,'Смерть','Death',4,'mag',19,3],             [61,'Тёмный лорд','Darklord',4,'atk',19,2],
  [62,'Злобный бог','Evilgod',4,'mag',20,2],       [63,'Падший бог','God',4,'atk',20,2],
  [64,'Падшая богиня','Goddess',4,'mag',20,2],     [65,'Падший ангел','Angel',4,'atk',19,3],
  [66,'Железный гигант','Irongiant',4,'tank',20,2],
];
for (const [id,n,b,t,r,d,dn] of NEW2) enemies[id]=enemy(id,n,b,t,r,d,dn);
// even more foes (67-80), spread across the zones
const NEW3 = [
  [67,'Кобольд','Imp',1,'fast',12,3],          [68,'Кислотный слизень','Slime',1,'mag',13,3],
  [69,'Костяной пёс','Skeleton',2,'fast',2,3], [70,'Упырь','Zombie',2,'atk',15,3],
  [71,'Жрец культа','Mage',2,'mag',16,3],       [72,'Магмовый голем','Irongiant',3,'tank',2,4],
  [73,'Пламенный пёс','Cerberus',3,'fast',13,3],[74,'Демон-страж','Demon',3,'tank',17,3],
  [75,'Ледяной голем','Irongiant',3,'tank',2,4],[76,'Снежная ведьма','Succubus',3,'mag',16,3],
  [77,'Морозный волк','Werewolf',3,'fast',18,3],[78,'Жнец','Death',4,'atk',19,2],
  [79,'Архидемон','Darklord',4,'mag',20,2],     [80,'Тёмный серафим','Angel',4,'atk',20,2],
];
for (const [id,n,b,t,r,d,dn] of NEW3) enemies[id]=enemy(id,n,b,t,r,d,dn);
// re-stat the original foes 1-5 onto the new (stronger) tier curve [tier, role]
const RESTAT = {1:[1,'atk'],2:[1,'fast'],3:[2,'tank'],4:[1,'tank'],5:[2,'atk']};
for (const id in RESTAT) { const e=enemies[id]; if(!e) continue; const [t,r]=RESTAT[id];
  e.params=eStats(t,r); e.exp=TIER.exp[t]; e.gold=TIER.gold[t]; e.role=r; }
write('Enemies', enemies);

// ---- aura states: 40 «Усиленный» (red, +stats) / 41 «Элитный» (purple, ++stats) ----
const states = read('States');
const mkState=(id,name,icon,traits,note)=>({id,autoRemovalTiming:0,chanceByDamage:100,iconIndex:icon,maxTurns:1,minTurns:1,
  motion:0,overlay:0,priority:50,message1:'',message2:'',message3:'',message4:'',releaseByDamage:false,removeAtBattleEnd:false,
  removeByDamage:false,removeByRestriction:false,removeByWalking:false,restriction:0,stepsToRemove:100,name,note,traits});
const pr=(p,v)=>({code:21,dataId:p,value:v});   // param-rate trait (0 MHP,2 ATK,3 DEF,4 MAT)
// extend, then PATCH every null hole with a valid empty state (null entries crash YEP_SkillCore)
while(states.length<43) states.push(null);
for(let i=1;i<states.length;i++) if(!states[i]) states[i]=mkState(i,'',0,[],'');
states[40]=mkState(40,'Усиленный',16,[pr(0,2.0),pr(2,2.0),pr(3,1.5)],'<State Animation: 52>');            // elite: 2x (аура силы, не огонь)
states[41]=mkState(41,'Элитный',17,[pr(0,3.0),pr(2,3.0),pr(3,2.0),pr(4,2.0)],'<State Animation: 53>');    // champion: 3x (аура силы)
states[42]=mkState(42,'Босс',0,[pr(0,3.0),pr(2,0.65),pr(3,1.5),pr(4,0.65)],'');                            // boss: 3x HP, но урон ×0.65 (не шотает)
write('States', states);

// ======================= TROOPS (extend with tiered combos) =======================
const troops = read('Troops'); while(troops.length<5) troops.push(null);
function troop(id,name,members){ return {id,name,members,pages:[{conditions:{actorHp:50,actorId:1,actorValid:false,enemyHp:50,enemyIndex:0,enemyValid:false,switchId:1,switchValid:false,turnA:0,turnB:0,turnEnding:false,turnValid:false},list:[{code:0,indent:0,parameters:[]}],span:0}]}; }
const isBig = e => e>=14;   // $BigMonster battlers — need room, never 3+ on screen
const POS = { 1:[[408,340]], 2:[[300,360],[516,360]], 3:[[250,370],[408,310],[566,370]], 4:[[200,372],[345,330],[480,372],[615,330]] };
const POS_BIG = { 1:[[408,330]], 2:[[230,330],[586,330]] };
const mem=(eid,xy)=>({enemyId:eid,x:xy[0],y:xy[1],hidden:false});
function tr(id,name,ids){ let a=ids; const big=ids.some(isBig); if(big&&a.length>2)a=a.slice(0,2); const pos=(big?POS_BIG:POS)[a.length]||POS[4]; return troop(id,name,a.map((e,i)=>mem(e,pos[i]))); }
// tier pools of enemy ids
const POOL = { 1:[1,2,6,7], 2:[3,4,8,9,10], 3:[11,12,13], 4:[14] };
// only enemies that have a fitting MAP sprite become visible monsters (rat/snake/
// spider have no charset, so they appear only in random encounters)
const POOL_VISIBLE = { 1:[1,6,4], 2:[3,4,8,10], 3:[11,12,13], 4:[14,13,11] };
// regular troops 5-20 (4 per tier, 1-3 enemies)
let tid=5; const TROOPS_BY_TIER={1:[],2:[],3:[],4:[]};
for (const t of [1,2,3,4]) {
  const p=POOL[t];
  const pick=k=>Array.from({length:k},(_,i)=>p[i%p.length]);
  const combos = t===4 ? [[p[0]],[p[0],p[0]]] : [pick(2),pick(3),pick(4),[p[Math.min(1,p.length-1)]]];   // small: up to 4; big: max 2
  for (const c of combos){ const id=tid++; troops[tid-1]=tr(id,'Этаж t'+t,c); TROOPS_BY_TIER[t].push(id); }
}
// also reuse original troops 1-3 in tier1 pool
TROOPS_BY_TIER[1].unshift(1,2,3);
TROOPS_BY_TIER[2].unshift(3);
// boss troops
// hard-boss troops for floors 10/20/30/40/50 (last two field 2 big foes)
const HARD_IDS = {10:[27], 20:[28], 30:[29], 40:[30], 50:[31]};   // dedicated boss monarchs (state 42)
const HARD = {};
for (const f of [10,20,30,40,50]) { HARD[f]=tid; troops[tid]=tr(tid,'Монарх '+f, HARD_IDS[f]); tid++; }
const MINI_ID = {5:20, 15:18, 25:19, 35:20, 45:19};   // elite variants (2x via state 40)
const RIFT_TROOP = tid; troops[tid]=tr(tid,'Страж разлома',[13]); tid++;   // single enemy (no overlap)
// single-enemy troops so a visible map monster == exactly who you fight
const SINGLE = {};
for (let e = 1; e <= 80; e++) { if(!enemies[e]) continue; SINGLE[e] = tid; troops[tid] = tr(tid, enemies[e].name, [e]); tid++; }
write('Troops', troops);
const items = read('Items');   // for chest loot descriptions

// ===== per-monster essences: state (42+id) + item (20+id); rarity by zone =====
const ZONE_ENEMIES = [
  [1,2,6,7,9,32,33,34,35,36,37,38,67,68],            // зона1 → редкость 1 (зелёная)
  [3,8,12,39,40,41,42,43,44,45,69,70,71],            // зона2 → 2 (синяя)
  [11,13,24,26,46,47,48,49,50,51,52,18,19,72,73,74], // зона3 → 3 (фиол.)
  [10,25,53,54,55,56,57,58,59,20,75,76,77],          // зона4 → 4 (красная)
  [14,21,22,23,60,61,62,63,64,65,66,78,79,80],       // зона5 → 5 (легендарная)
];
const zoneRarity = {};
ZONE_ENEMIES.forEach((list, zi) => list.forEach(e => { if (zoneRarity[e] === undefined) zoneRarity[e] = zi + 1; }));
[27,28,29,30,31].forEach(e => zoneRarity[e] = 5);    // боссы — легендарные
const RCOLOR = {1:3,2:1,3:5,4:2,5:14}, RNAME = {1:'Необычная',2:'Особая',3:'Редкая',4:'Магическая',5:'Легендарная'}, RMAG = {1:0.04,2:0.06,3:0.09,4:0.13,5:0.18};
const roleOf = p => (p[4] > p[2] ? 'mag' : (p[6] > p[2] ? 'fast' : (p[3] >= p[2] ? 'tank' : 'atk')));
// === ТИПЫ эссенций: РАЗНЫЕ эффекты (статы / уклонение / мана / крит / регена / иммунитет) ===
const xpr  = (i,v) => ({code:22,dataId:i,value:v});   // xparam: 1=EVA 2=CRI 7=HRG(HP-реген) 8=MRG(MP-реген)
const sres = (s)   => ({code:14,dataId:s,value:0});   // иммунитет к состоянию
const ESS_TYPES = [
  {tag:'Сила',          tr:m=>[pr(2,1+m)]},                          // +ATK%
  {tag:'Магия',         tr:m=>[pr(4,1+m)]},                          // +MAT%
  {tag:'Защита',        tr:m=>[pr(3,1+m),pr(5,1+m*0.6)]},            // +DEF/MDF%
  {tag:'Здоровье',      tr:m=>[pr(0,1+m)]},                          // +MHP%
  {tag:'Ловкость',      tr:m=>[pr(6,1+m)]},                          // +AGI%
  {tag:'Мана',          tr:m=>[pr(1,1+m*1.5),xpr(8,0.05+m)]},        // +MMP% + MP-реген
  {tag:'Уклонение',     tr:m=>[xpr(1,0.04+m*0.6)]},                  // +EVA
  {tag:'Критич. удар',  tr:m=>[xpr(2,0.04+m*0.6)]},                  // +CRI
  {tag:'Регенерация',   tr:m=>[xpr(7,0.04+m*0.6)]},                  // +HP-реген
  {tag:'Иммунитет: яд', noPct:true, tr:m=>[sres(127),sres(128),sres(133)]},  // от яда/поджога/кровот.
  {tag:'Иммунитет: оглушение', noPct:true, tr:m=>[sres(131),sres(130)]},     // от оглушения/раскола
];
const headPct = tr0 => tr0.code===21 ? '+'+Math.round((tr0.value-1)*100)+'%'
                      : tr0.code===22 ? '+'+Math.round(tr0.value*100)+'%' : '';
const emptyItem = id => ({id,animationId:0,consumable:true,damage:{critical:false,elementId:0,formula:'0',type:0,variance:20},description:'',effects:[],hitType:0,iconIndex:0,itypeId:1,name:'',note:'',occasion:0,price:0,repeats:1,scope:0,speed:0,successRate:100,tpGain:0});
for (let m = 1; m < enemies.length; m++) {
  const e = enemies[m]; if (!e) continue;
  const rar = zoneRarity[m] || (e.params[0] >= 900 ? 4 : e.params[0] >= 350 ? 3 : e.params[0] >= 180 ? 2 : 1);
  const mag = RMAG[rar], et = ESS_TYPES[(m-1) % ESS_TYPES.length], sid = 42 + m, iid = 20 + m;
  const role = e.role || roleOf(e.params);   // для спец-атак ниже
  const traits = et.tr(mag);
  states[sid] = mkState(sid, et.tag + ' — ' + e.name, 79, traits, '<Essence>');
  items[iid] = { id:iid, animationId:0, consumable:false, damage:{critical:false,elementId:0,formula:'0',type:0,variance:20},
    description: '[' + RNAME[rar] + '] ' + et.tag + (et.noPct ? '' : ' ' + headPct(traits[0])) + '.',
    effects:[{code:21,dataId:sid,value1:1,value2:0}], hitType:0, iconIndex:79, itypeId:1, name:'['+RNAME[rar]+'] '+et.tag+' — '+e.name,
    note:'', occasion:0, price:rar*300, repeats:1, scope:11, speed:0, successRate:100, tpGain:0, textColor:RCOLOR[rar],
    essence:true, rarity:rar };
  const eDenom = (m >= 27 && m <= 31) ? 1 : 3;   // боссы 100%, обычные ~35% (1/3)
  e.dropItems = [{dataId:iid,denominator:eDenom,kind:1},{dataId:1,denominator:6,kind:1}];   // own essence + a potion
  // special attacks (skills 65-72 from gen_phase11) by role; HP-condition fractions 0..1
  const act = (skillId,rating,ct,p1,p2) => ({conditionType:ct||0,conditionParam1:p1||0,conditionParam2:p2||0,rating:rating||3,skillId});
  const sp  = (skillId,rating) => act(skillId, rating, 1, 2, 1);    // с 2-го хода (не на 1-м ходу); кулдаун навыка ограничит частоту
  // каждый моб получает ОДНУ особую атаку по роли (со 2-го хода + кулдаун → не каждый ход)
  if      (role==='tank') e.actions.push(sp(65,3));               // раскол брони
  else if (role==='fast') e.actions.push(sp(68,3));               // кровотечение
  else if (role==='mag')  e.actions.push(sp(69,3));               // яд
  else if (role==='atk')  e.actions.push(m%2===0 ? sp(66,2) : sp(67,3));  // часть atk оглушает, часть ослабляет
  if (m>=18 && m<=31) e.actions.push(sp(66,2));                   // элиты/минибоссы/боссы дополнительно могут оглушать
  if (role==='mag')   e.actions.push(act(74,3,1,2,1));            // маги-враги лечат союзника (с 2-го хода)
  if (m>=18 && m<=23) e.actions.push(act(70,5,2,0,0.5));          // элиты лечат себя 20% при HP<50%
  if (m>=27 && m<=31) { e.actions.push(act(71,9,2,0,0.6)); e.actions.push(act(72,4,1,2,1)); }  // босс: лечение 50% при HP<60% + рык
}
// ---- buff/debuff/support states 123-129 (applied by spells; временные, по ходам) ----
const xp = (i,v) => ({code:22,dataId:i,value:v});       // xparam (7=HRG регенерация/яд)
const sr = (s) => ({code:14,dataId:s,value:0});          // state-resist (иммунитет к состоянию)
const stTurn = (id,name,icon,traits,turns,msg) => { const s=mkState(id,name,icon,traits,''); s.autoRemovalTiming=2; s.minTurns=turns; s.maxTurns=turns; s.removeAtBattleEnd=true; s.message1=msg||''; s.message2=msg||''; s.message4=msg?' — эффект спал.':''; return s; };
states[123]=stTurn(123,'Щит',81,[pr(3,1.5)],2,' под Щитом (DEF +50%)');
states[124]=stTurn(124,'Ярость',77,[pr(2,1.5)],2,' в Ярости (ATK +50%)');
states[125]=stTurn(125,'Регенерация',72,[xp(7,0.10)],2,' под Регенерацией (+10% HP/ход)');
states[126]=stTurn(126,'Иммунитет',84,[sr(4),sr(127),sr(128),sr(133)],2,' защищён от дебаффов');
states[127]=stTurn(127,'Отравление',1,[xp(7,-0.08)],4,' отравлен! (−8% HP/ход)');
states[128]=stTurn(128,'Поджог',2,[xp(7,-0.12)],3,' горит! (−12% HP/ход)');
states[129]=stTurn(129,'Ослабление',1,[pr(2,0.7)],4,' ослаблен (ATK −30%)');
// ---- вражеские спец-состояния 130-134 ----
states[130]=stTurn(130,'Раскол брони',81,[pr(3,0.6)],2,' — броня расколота (DEF −40%)');
states[131]=stTurn(131,'Оглушение',6,[],2,' оглушён!'); states[131].restriction=4;  // 2 хода (в пошаговом MV = пропуск 1 хода)
states[132]=stTurn(132,'Слабость',76,[pr(2,0.9)],2,' ослаблен (ATK −10%)');
states[133]=stTurn(133,'Кровотечение',1,[xp(7,-0.08)],3,' истекает кровью! (−8% HP/ход)');
states[134]=stTurn(134,'Магический барьер',78,[pr(3,1.5),pr(5,1.5)],2,' под Магическим барьером (DEF/MDF +50%)');
for (let i = 1; i < states.length; i++) if (!states[i]) states[i] = mkState(i, '', 0, [], '');  // no null holes
for (let i = 1; i < items.length;  i++) if (!items[i])  items[i]  = emptyItem(i);
write('Enemies', enemies); write('States', states); write('Items', items);

// ======================= command DSL =======================
const wrap=(ls,max=30)=>{const o=[];for(const ln of ls){if(ln.length<=max){o.push(ln);continue;}let c='';for(const w of ln.split(' ')){if((c+' '+w).trim().length>max){if(c)o.push(c);c=w;}else c=(c?c+' ':'')+w;}if(c)o.push(c);}return o;};
function CL(){const L=[];let ind=0;const p=(code,par=[])=>L.push({code,indent:ind,parameters:par});
  const api={ text(ls){p(101,['',0,0,2]);for(const t of wrap(ls))p(401,[t]);return api;},
    addVar(v,d){p(122,[v,v,d>=0?1:2,0,Math.abs(d)]);return api;}, setSwitch(s,on=true){p(121,[s,s,on?0:1]);return api;},
    selfSw(ch,on=true){p(123,[ch,on?0:1]);return api;}, gold(d){p(125,[d>=0?0:1,0,Math.abs(d)]);return api;},
    giveItem(id,q=1){p(126,[id,0,0,q]);return api;}, transfer(m,x,y,dir=2){p(201,[0,m,x,y,dir,0]);return api;},
    battle(t){p(301,[0,t,false,false]);return api;}, ifSwitch(s,on=true){p(111,[0,s,on?0:1]);ind++;return api;}, ifVar(v,val,cmp=0){p(111,[1,v,0,val,cmp]);ind++;return api;}, else_(){ind--;p(411);ind++;return api;}, end(){ind--;p(412);return api;},
    script(code){const a=code.split('\n');p(355,[a[0]]);for(let i=1;i<a.length;i++)p(655,[a[i]]);return api;},
    shop(g){p(302,[...g[0],false]);for(let i=1;i<g.length;i++)L.push({code:605,indent:ind,parameters:g[i]});return api;},
    label(t){L.unshift({code:408,indent:0,parameters:['<Mini Label Range: 2>']});L.unshift({code:108,indent:0,parameters:[`<Mini Label: ${t}>`]});return api;},
    stop(){p(0);return api;}, done(){return L;} }; return api; }

const route={list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false};
const spr=(n,i=0)=>({tileId:0,characterName:n,direction:2,pattern:1,characterIndex:i});
const invis=()=>({tileId:0,characterName:'',direction:2,pattern:1,characterIndex:0});
const cond=(sw)=>({actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:!!sw,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0});
function page(image,list,trigger,priority,sw){ return {conditions:cond(sw),directionFix:false,image,list,moveFrequency:3,moveRoute:route,moveSpeed:3,moveType:0,priorityType:priority,stepAnime:false,through:false,trigger,walkAnime:true}; }
function ev1(id,name,x,y,image,list,trigger=0,priority=1){ return {id,name,note:'',x,y,pages:[page(image,list,trigger,priority,false)]}; }

// chest: page1 gives loot + self-switch A; page2 (A) is the opened/empty chest
function chest(id,x,y,lootCmds){
  const p1=CL(); lootCmds(p1); p1.selfSw('A',true).stop();
  return {id,name:'Сундук',note:'',x,y,pages:[
    page(spr('!Chest',0),p1.done(),0,1,false),
    page(spr('!Chest',1),CL().text(['Пусто.']).stop().done(),0,1,true),
  ]};
}
// visible monster: touch -> battle -> vanish (self-switch A); page2 empty
function monster(id,x,y,sprName,sprIdx,troopId,labelName){
  return {id,name:'Монстр',note:'',x,y,pages:[
    page(spr(sprName,sprIdx),CL().label(labelName).battle(troopId).selfSw('A',true).stop().done(),2,1,false),
    page(invis(),[{code:0,indent:0,parameters:[]}],0,0,true),
  ]};
}
// map each enemy to a fitting map sprite (Monster.png idx / big sheets) so the
// creature you approach LOOKS like who you fight
const ENEMY_SPRITE = {
  1:['Monster',2], 2:['Monster',1], 3:['Monster',5], 4:['Monster',1], 5:['$BigMonster1',0],
  6:['Monster',0], 7:['Monster',0], 8:['Monster',6], 9:['Monster',0], 10:['Monster',7],
  11:['Monster',4], 12:['Monster',6], 13:['Monster',3], 14:['$BigMonster1',0],
  15:['$BigMonster1',0], 16:['$BigMonster2',0], 17:['$BigMonster2',0],
  // elite/champion variants reuse their base creature's map sprite (glow shows in battle)
  18:['Monster',4], 19:['Monster',3], 20:['$BigMonster1',0],
  21:['Monster',3], 22:['$BigMonster2',0], 23:['$BigMonster1',0],
};
const monSprite = e => ENEMY_SPRITE[e] || ['Monster', e % 8];

// boss: action-trigger, one-time (self-switch A). reward(cl) runs after the battle.
function bossEvent(id,x,y,sprName,sprIdx,troopId,label,intro,reward){
  const p1=CL().label(label).text([intro]).battle(troopId); reward(p1); p1.selfSw('A',true).stop();
  return {id,name:'Босс',note:'',x,y,pages:[
    page(spr(sprName,sprIdx),p1.done(),0,1,false),
    page(spr(sprName,sprIdx),CL().text(['Поверженный страж.']).stop().done(),0,1,true),
  ]};
}

// ======================= FLOORS =======================
// five 10-floor zones, each a distinct look (floor/wall autotile + battleback + bgm)
const ZONES = [
  {name:'Пещеры',   floor:17, wall:81, bb1:'RockCave',  bb2:'RockCave', bgm:'Dungeon1', tier:1, vis:[1,6,4],    enc:ZONE_ENEMIES[0].map(e=>SINGLE[e]).concat(TROOPS_BY_TIER[1])},
  {name:'Склеп',    floor:24, wall:96, bb1:'Ruins2',    bb2:'Brick',    bgm:'Dungeon2', tier:2, vis:[3,4,8,10], enc:ZONE_ENEMIES[1].map(e=>SINGLE[e]).concat(TROOPS_BY_TIER[2])},
  {name:'Пекло',    floor:34, wall:88, bb1:'LavaCave',  bb2:'Lava',     bgm:'Dungeon3', tier:3, vis:[18,19,11], enc:ZONE_ENEMIES[2].map(e=>SINGLE[e]).concat(TROOPS_BY_TIER[3])},
  {name:'Мерзлота', floor:40, wall:83, bb1:'IceCave',   bb2:'IceCave',  bgm:'Dungeon2', tier:3, vis:[20,18,12], enc:ZONE_ENEMIES[3].map(e=>SINGLE[e]).concat(TROOPS_BY_TIER[3])},
  {name:'Бездна',   floor:47, wall:95, bb1:'DarkSpace', bb2:'DarkSpace',bgm:'Dungeon3', tier:4, vis:[21,22,23], enc:ZONE_ENEMIES[4].map(e=>SINGLE[e]).concat(TROOPS_BY_TIER[4])},
];
const DECOR = [48,49,50];   // rock + crystals only
const SPOTS = [[2,2],[14,2],[2,10],[14,10],[7,6],[9,6],[2,6],[14,6]];
const DECOR_SPOTS = [[3,3],[13,3],[3,9],[13,9],[6,2],[10,2],[6,10],[10,10]];
const mapinfos = read('MapInfos');
const FLOORS = 50;
const FLOOR_MAP_ID = n => 100 + n;        // floor1 -> Map101 ... floor50 -> Map150 (avoids shop ids 18-22)
const isHard = n => n % 10 === 0;          // 10,20,30,40,50 — gated bosses
const isMini = n => n % 5 === 0 && !isHard(n);   // 5,15,25,35,45 — optional sub-bosses
const HARD_SW = { 10:10, 20:11, 30:12, 40:13, 50:14 };

for (let n = 1; n <= FLOORS; n++) {
  const Z = ZONES[Math.floor((n-1)/10)], tier = Z.tier;
  const floorKind = Z.floor, wallKind = Z.wall;
  const W=17,H=13, mid=FLOOR_MAP_ID(n);
  const m={ autoplayBgm:true,autoplayBgs:true,battleback1Name:Z.bb1,battleback2Name:Z.bb2,
    bgm:{name:Z.bgm,pan:0,pitch:100,volume:80},bgs:{name:'Drips',pan:0,pitch:100,volume:60},
    disableDashing:false,displayName:`${Z.name} — этаж ${n}`,encounterList:Z.enc.map(t=>({troopId:t,weight:10,regionSet:[]})),
    encounterStep:24,height:H,note:'',parallaxLoopX:false,parallaxLoopY:false,parallaxName:'',parallaxShow:true,parallaxSx:0,parallaxSy:0,
    scrollType:0,specifyBattleback:true,tilesetId:4,width:W,data:new Array(W*H*6).fill(0),events:[null] };
  fillLayer(m,0,A2(floorKind));
  wallRect(m,0,0,W,1,wallKind,1); wallRect(m,0,H-1,W,1,wallKind,1); wallRect(m,0,0,1,H,wallKind,1); wallRect(m,W-1,0,1,H,wallKind,1);
  // (interior pillar walls removed — they read as confusing grey blocks)
  // scattered decor (layer 2)
  DECOR_SPOTS.forEach((s,i)=> setT(m,s[0],s[1],2, DECOR[(n+i)%DECOR.length]));

  // UP stairs = leave & sleep (advance a day, restore) — available on EVERY floor
  m.events[1]=ev1(1,'Выход',8,11,invis(),
    CL().label('Выход ▲').script('window.labStartCooldown();').setSwitch(3,false)
      .script('var v=$gameVariables; v.setValue(4,v.value(4)+1); v.setValue(11,0); v.setValue(12,100); $gameParty.members().forEach(function(a){a.setHp(a.mhp);a.setMp(a.mmp);[4,17,18,19,20,21].forEach(function(s){a.removeState(s);});});')
      .text(['Ты выбираешься наружу и засыпаешь.','День \\V[4]. Силы восстановлены.']).transfer(2,20,4,2).stop().done(), 2);
  // DOWN stairs = descend; records deepest floor in Var5 so you resume here next run
  if (n < FLOORS) {
    const adv = `var v=$gameVariables; if(v.value(5)<${n+1}) v.setValue(5,${n+1});`;
    const down = isHard(n)
      ? CL().label('Глубже ▼').ifSwitch(HARD_SW[n],true).script(adv).transfer(FLOOR_MAP_ID(n+1),8,10,8).else_().text(['Путь вниз запечатан.','Сначала одолей Монарха этажа.']).end().stop().done()
      : CL().label('Глубже ▼').script(adv).transfer(FLOOR_MAP_ID(n+1),8,10,8).stop().done();
    m.events[2]=ev1(2,'Глубже',8,1,invis(), down, 2);
  } else {
    m.events[2]=ev1(2,'Грань Бездны',8,1,invis(),
      CL().label('◆ Конец').ifSwitch(HARD_SW[50],true).text(['Ты покорил все 50 этажей Лабиринта!']).setSwitch(60,true).else_().text(['Дальше — пустота. Сначала одолей Владыку Бездны.']).end().stop().done(), 2);
  }

  // chests (loot scales with zone tier)
  let eid=3;
  const addEv = factory => { const id=eid++; m.events[id]=factory(id); };
  const c1=SPOTS[n%SPOTS.length], c2=SPOTS[(n+3)%SPOTS.length], c3=SPOTS[(n+6)%SPOTS.length];
  const potId = tier>=3?3:tier>=2?2:1, potQ=2, goldAmt=TIER.gold[tier]*3;
  addEv(id => chest(id, c1[0],c1[1], p=>{ p.giveItem(potId,potQ).gold(goldAmt).text(['Сундук:', potQ+'× '+items[potId].name+', +'+goldAmt+' зол.']); }));
  addEv(id => chest(id, c2[0],c2[1], p=>{ p.script('window.dropChestEssence();').text(['Сундук — эссенция:','\\V[88]']); }));
  addEv(id => chest(id, c3[0],c3[1], p=>{ p.script('window.dropChestGear();').text(['Сундук — снаряжение:','\\V[88]']); }));
  // visible monsters (2-3 from the zone pool); approach one = exactly that fight
  const pool=Z.vis;
  const mspots=[SPOTS[(n+1)%SPOTS.length],SPOTS[(n+5)%SPOTS.length],SPOTS[(n+2)%SPOTS.length]];
  const mcount = 2 + (n%3===0?1:0);
  for (let i=0;i<mcount;i++){ const e=pool[(n+i)%pool.length], sp=mspots[i]; addEv(id => monster(id, sp[0],sp[1], ...monSprite(e), SINGLE[e], enemies[e].name)); }
  // hard boss (every 10th) — beating it opens the descent + advances the checkpoint
  if (isHard(n)) { const sw=HARD_SW[n];
    addEv(id => bossEvent(id,8,4,'$BigMonster'+(n>=40?'2':'1'),0,HARD[n],'МОНАРХ',`Монарх зоны «${Z.name}» пробуждается!`, p=>{
      p.setSwitch(sw,true).gold(TIER.gold[tier]*8).giveItem(19,1).text(['Монарх повержен! Путь вглубь открыт.']); }));
  } else if (isMini(n)) { const e=MINI_ID[n];
    addEv(id => bossEvent(id,8,4,...monSprite(e),SINGLE[e],'★ Мини-босс',`${enemies[e].name} преграждает путь!`, p=>{
      p.script('window.dropChestEssence(); window.dropChestEssence();').gold(TIER.gold[tier]*4).text(['Мини-босс повержен! Добыто 2 эссенции.']); }));
  }
  // rift (occasional): strong lone foe + rift essence
  if (n%7===3) { addEv(id => ev1(id,'Разлом',13,6, spr('!Crystal',0),
      CL().label('Разлом ◆').text(['Разлом пульсирует тьмой!']).battle(RIFT_TROOP).giveItem(19,1).text(['Из разлома — Эссенция Стража!']).stop().done())); }
  // floor 1: essence trader
  if (n===1) { addEv(id => ev1(id,'Торговец эссенциями',2,6, spr('People3',1),
      CL().label('Эссенции').text(['Свежие эссенции из глубин.']).shop([[0,11,1,250],[0,12,1,250],[0,13,1,350],[0,15,1,350],[0,17,1,800]]).stop().done())); }
  // (darkness is handled by the LightFog plugin — a vision circle around the player)

  write('Map'+String(mid).padStart(3,'0'), m);
  mapinfos[mid]={id:mid,expanded:false,name:`${Z.name} ${n}`,order:mid,parentId:0,scrollX:0,scrollY:0};
  if (n%10===1) savePreview(m,4,`_build/preview_floor${n}.png`,1);   // one sample per zone
}
// retire the old 12-floor maps (Map006-017) now that floors live at Map101+
for (let id=6; id<=17; id++){ mapinfos[id]=null; try{ fs.unlinkSync(`${DIR}/Map${String(id).padStart(3,'0')}.json`); }catch(e){} }
write('MapInfos', mapinfos);

// death message CE (parallel, Switch 51)
const ce=read('CommonEvents'); while(ce.length<14) ce.push(null);
ce[13]={id:13,name:'Смерть в лабиринте',switchId:51,trigger:2,list:[
  {code:101,indent:0,parameters:['',0,0,2]},{code:401,indent:0,parameters:['Ты пал в Лабиринте...']},
  {code:401,indent:0,parameters:['Тебя вынесли. Потеряно \\V[99] золота.']},
  {code:121,indent:0,parameters:[51,51,1]},{code:0,indent:0,parameters:[]}]};
write('CommonEvents', ce);

// (the city gate is owned by gen_town, which runs last and resumes at Var5)

console.error(`Phase 10 v3: ${FLOORS} floors / 5 zones, enemies->${enemies.filter(Boolean).length}, troops->${troops.filter(Boolean).length}, hard bosses 10/20/30/40/50, mini 5/15/25/35/45.`);
