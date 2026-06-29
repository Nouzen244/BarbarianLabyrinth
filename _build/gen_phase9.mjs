// PHASE 9 — Suspicion (Variable 3). Parallel watcher exposes the player at 100;
// the Guard reacts by suspicion tier; a Townswoman offers a "use forbidden
// knowledge" choice that raises suspicion (a testable gain). Runs after gen_city.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const wrap = (lines, max = 30) => { const o = []; for (const ln of lines) { if (ln.length <= max) { o.push(ln); continue; }
  let c=''; for (const w of ln.split(' ')) { if ((c+' '+w).trim().length>max){ if(c)o.push(c); c=w; } else c=(c?c+' ':'')+w; } if(c)o.push(c); } return o; };
function CL() { const L=[]; let ind=0; const p=(code,par=[])=>L.push({code,indent:ind,parameters:par});
  const api={
    text(lines){ p(101,['',0,0,2]); for(const t of wrap(lines)) p(401,[t]); return api; },
    ifVar(v,val,cmp=0){ p(111,[1,v,0,val,cmp]); ind++; return api; },   // cmp 0:== 1:>= 2:<= 3:> 4:< 5:!=
    ifSwitch(s,on=true){ p(111,[0,s,on?0:1]); ind++; return api; },
    else_(){ ind--; p(411); ind++; return api; },
    end(){ ind--; p(412); return api; },
    addVar(v,delta){ p(122,[v,v,delta>=0?1:2,0,Math.abs(delta)]); return api; },  // 1:add 2:sub
    setVar(v,val){ p(122,[v,v,0,0,val]); return api; },
    setSwitch(s,on=true){ p(121,[s,s,on?0:1]); return api; },
    choices(opts){ p(102,[opts,0,0,2,0]); return api; },
    when(i,l){ p(402,[i,l]); ind++; return api; },
    whenEnd(){ ind--; return api; },
    choiceEnd(){ p(404); return api; },
    wait(f){ p(230,[f]); return api; },
    label(text){ L.unshift({code:408,indent:0,parameters:['<Always Show Mini Label>']}); L.unshift({code:108,indent:0,parameters:[`<Mini Label: ${text}>`]}); return api; },
    stop(){ p(0); return api; },
    done(){ return L; },
  }; return api; }

// ---- parallel suspicion watcher (CommonEvent 12) ----
const watcher = CL()
  .ifVar(3, 100, 1)                       // Suspicion >= 100
    .ifSwitch(5, false)                   // not yet exposed
      .setSwitch(5, true)
      .text(['Шёпот за спиной крепнет.', '«Злой дух среди нас!»', 'Охота на тебя началась...'])
      .setVar(3, 80)                      // back off so it doesn't re-fire instantly
    .end()
  .end()
  .wait(60)
  .stop().done();

const ce = read('CommonEvents');
while (ce.length < 13) ce.push(null);
ce[12] = { id: 12, list: watcher, name: 'Надзор: подозрение', switchId: 1, trigger: 2 }; // parallel, on while Switch1
write('CommonEvents', ce);

// ---- NPC reactions on Map002 ----
const city = read('Map002');
const guard = city.events.find(e => e && e.id === 6);   // Стражник
if (guard) guard.pages[0].list = CL().label('Стражник')
  .ifVar(3, 60, 1).text(['\\n<Стражник>Я слежу за каждым шагом, чужак.'])
  .else_().ifVar(3, 30, 1).text(['\\n<Стражник>Ты какой-то странный...'])
    .else_().text(['\\n<Стражник>Доброго дня. Веди себя достойно.']).end()
  .end().stop().done();

const woman = city.events.find(e => e && e.id === 7);   // Горожанка — testable suspicion gain
if (woman) woman.pages[0].list = CL().label('Горожанка')
  .text(['\\n<Горожанка>Расскажешь, что знаешь о Лабиринте?'])
  .choices(['Поделиться знанием', 'Промолчать'])
    .when(0, 'Поделиться знанием')
      .text(['Ты говоришь то, чего знать не мог...'])
      .addVar(3, 15)
      .text(['Горожанка отшатнулась. (Подозрение +15)'])
    .whenEnd()
    .when(1, 'Промолчать').text(['...Лучше промолчать.']).whenEnd()
  .choiceEnd().stop().done();

write('Map002', city);
console.error('Phase 9: suspicion watcher CE12 (parallel); Guard tiers + Townswoman gain choice set.');
