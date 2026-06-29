// PHASE 8 — Essence synergies (auto passive states) + an "unslot essences"
// option at the in-labyrinth trader. Slot cap itself is enforced by the
// EssenceSlots plugin (active essences 22-31 <= Variable 24).
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

// ---- synergy passive states (32, 33) ----
function passive(id, name, icon, traits, cond, desc) {
  return { id, autoRemovalTiming: 0, chanceByDamage: 100, iconIndex: icon, maxTurns: 1, minTurns: 1,
    motion: 0, overlay: 0, priority: 25, message1: '', message2: '', message3: '', message4: '',
    releaseByDamage: false, removeAtBattleEnd: false, removeByDamage: false, removeByRestriction: false,
    removeByWalking: false, restriction: 0, stepsToRemove: 100, name, traits,
    note: `${desc}\n<Custom Passive Condition>\ncondition = ${cond};\n</Custom Passive Condition>` };
}
const atkElem = id => ({ code: 31, dataId: id, value: 0 });
const param = (id, r) => ({ code: 21, dataId: id, value: r });
const xparam = (id, v) => ({ code: 22, dataId: id, value: v });

const states = read('States');
while (states.length < 34) states.push(null);
states[32] = passive(32, 'Синергия: Поджог', 64,
  [atkElem(2), param(2, 1.10)], 'a.isStateAffected(22) && a.isStateAffected(23)',
  'Огонь + Пепел: атаки горят, +10% ATK.');
states[33] = passive(33, 'Синергия: Покров Ночи', 78,
  [xparam(1, 0.20)], 'a.isStateAffected(24) && a.isStateAffected(25)',
  'Тень + Ночь: +20% уклонения.');
write('States', states);

// ---- actor 1: declare synergy passives ----
const actors = read('Actors');
actors[1].note = '<Passive State: 11 to 16>\n<Passive State: 32, 33>';
write('Actors', actors);

// ---- essence trader (Map006 ev3): add buy / unslot / leave ----
const wrap = (lines, max=30) => { const o=[]; for(const ln of lines){ if(ln.length<=max){o.push(ln);continue;} let c=''; for(const w of ln.split(' ')){ if((c+' '+w).trim().length>max){if(c)o.push(c);c=w;} else c=(c?c+' ':'')+w;} if(c)o.push(c);} return o; };
function CL(){ const L=[]; let ind=0; const p=(code,par=[])=>L.push({code,indent:ind,parameters:par});
  const api={ text(ls){p(101,['',0,0,2]); for(const t of wrap(ls)) p(401,[t]); return api;},
    choices(o){p(102,[o,0,0,2,0]);return api;}, when(i,l){p(402,[i,l]);ind++;return api;}, whenEnd(){ind--;return api;}, choiceEnd(){p(404);return api;},
    shop(g){p(302,[...g[0],false]); for(let i=1;i<g.length;i++) L.push({code:605,indent:ind,parameters:g[i]}); return api;},
    script(c){const ls=c.split('\n');p(355,[ls[0]]);for(let i=1;i<ls.length;i++)p(655,[ls[i]]);return api;},
    label(t){L.unshift({code:408,indent:0,parameters:['<Mini Label Range: 2>']});L.unshift({code:108,indent:0,parameters:[`<Mini Label: ${t}>`]});return api;},
    stop(){p(0);return api;}, done(){return L;} }; return api; }
const Ic = (id,price) => [0,id,1,price];

const m6 = read('Map101');   // labyrinth floor 1 (moved from Map006 to avoid shop id clash)
const trader = m6.events.find(e => e && e.name === 'Торговец эссенциями');
if (trader) trader.pages[0].list = CL().label('Эссенции')
  .text(['Свежие эссенции из глубин.', 'Слотов занято: \\V[24] макс.'])
  .choices(['Купить', 'Снять все эссенции', 'Уйти'])
    .when(0, 'Купить').shop([Ic(11,250), Ic(12,250), Ic(13,350), Ic(15,350), Ic(17,800)]).whenEnd()
    .when(1, 'Снять все эссенции').script('$gameActors.actor(1).clearEssences();').text(['Все эссенции сняты. Слоты свободны.']).whenEnd()
    .when(2, 'Уйти').whenEnd()
  .choiceEnd().stop().done();
write('Map101', m6);

console.error('Phase 8: synergies 32/33 + actor passives + trader unslot option set.');
