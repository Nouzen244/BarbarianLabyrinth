// Random labyrinth encounters — parallel CommonEvent 14 (active while Switch 3).
// Periodically rolls a chance to spawn a friendly NPC (heal / essence / potions)
// or a hostile one (ambush battle / gold thief). Scratch vars 95-98.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const wrap=(ls,max=30)=>{const o=[];for(const ln of ls){if(ln.length<=max){o.push(ln);continue;}let c='';for(const w of ln.split(' ')){if((c+' '+w).trim().length>max){if(c)o.push(c);c=w;}else c=(c?c+' ':'')+w;}if(c)o.push(c);}return o;};
function CL(){const L=[];let ind=0;const p=(c,par=[])=>L.push({code:c,indent:ind,parameters:par});
  const api={ text(ls){p(101,['',0,0,2]);for(const t of wrap(ls))p(401,[t]);return api;},
    wait(f){p(230,[f]);return api;}, rand(v,a,b){p(122,[v,v,0,2,a,b]);return api;},
    ifV(v,val,cmp=0){p(111,[1,v,0,val,cmp]);ind++;return api;}, else_(){ind--;p(411);ind++;return api;}, end(){ind--;p(412);return api;},
    giveItem(id,q=1){p(126,[id,0,0,q]);return api;}, battleVar(v){p(301,[1,v,false,false]);return api;},
    script(code){const a=code.split('\n');p(355,[a[0]]);for(let i=1;i<a.length;i++)p(655,[a[i]]);return api;},
    stop(){p(0);return api;}, done(){return L;} }; return api; }

// 95 = trigger roll, 96 = friendly/hostile, 97 = sub-type, 98 = random troop
const list = CL()
  .wait(600)
  .rand(95, 1, 100)
  .ifV(95, 4, 2)                                  // ~4% per 10s tick (no spam)
    .rand(96, 1, 100)
    .ifV(96, 55, 2)                               // friendly
      .rand(97, 1, 3)
      .ifV(97, 1).text(['Бродячий лекарь латает твои раны.']).script('$gameParty.members().forEach(function(a){a.recoverAll();});').end()
      .ifV(97, 2).text(['Заблудший дух дарит эссенцию.']).giveItem(12, 1).end()
      .ifV(97, 3).text(['Торговец делится зельями.']).giveItem(1, 2).end()
    .else_()                                      // hostile
      .rand(97, 1, 2)
      .ifV(97, 1).text(['Засада! На тебя нападают!']).rand(98, 1, 12).battleVar(98).end()
      .ifV(97, 2).text(['Вор выскакивает из тьмы и крадёт золото!']).script('$gameParty.loseGold(Math.min($gameParty.gold(), 60 + Math.floor(Math.random()*140)));').end()
    .end()
    .wait(300)
  .end()
  .stop().done();

const ce = read('CommonEvents');
while (ce.length < 15) ce.push(null);
ce[14] = { id: 14, name: 'Случайные встречи (лабиринт)', switchId: 3, trigger: 2, list };
write('CommonEvents', ce);
console.error('Random labyrinth encounters: CommonEvent 14 (parallel, Switch 3).');
