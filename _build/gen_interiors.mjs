// ENTERABLE SHOPS — interior maps (Map003 general, Map004 racial, Map005 black
// market). City building doors (Map002 ev3/4/5) become transfers inside; the
// shop logic lives on a shopkeeper NPC in each interior. Runs after gen_city.
import fs from 'node:fs';
import { savePreview, fillLayer, fillRect, setT } from './maplib.mjs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

// ---------- command DSL (subset) ----------
const wrap = (lines, max = 30) => { const o = []; for (const ln of lines) { if (ln.length <= max) { o.push(ln); continue; }
  let c = ''; for (const w of ln.split(' ')) { if ((c + ' ' + w).trim().length > max) { if (c) o.push(c); c = w; } else c = (c ? c + ' ' : '') + w; } if (c) o.push(c); } return o; };
function CL() { const list = []; let ind = 0; const push = (code, p = []) => list.push({ code, indent: ind, parameters: p });
  const api = {
    text(lines){ push(101,['',0,0,2]); for(const t of wrap(lines)) push(401,[t]); return api; },
    ifVar(v,val){ push(111,[1,v,0,val,0]); ind++; return api; },
    ifSwitch(s,on=true){ push(111,[0,s,on?0:1]); ind++; return api; },
    else_(){ ind--; push(411); ind++; return api; },
    end(){ ind--; push(412); return api; },
    script(code){ const ls=code.split('\n'); push(355,[ls[0]]); for(let i=1;i<ls.length;i++) push(655,[ls[i]]); return api; },
    shop(goods,po=false){ push(302,[...goods[0],po]); for(let i=1;i<goods.length;i++) list.push({code:605,indent:ind,parameters:goods[i]}); return api; },
    choices(opts){ push(102,[opts,0,0,2,0]); return api; },
    when(i,l){ push(402,[i,l]); ind++; return api; },
    whenEnd(){ ind--; return api; },
    choiceEnd(){ push(404); return api; },
    transfer(mapId,x,y,dir=2){ push(201,[0,mapId,x,y,dir,0]); return api; },
    stop(){ push(0); return api; },
    done(){ return list; },
  }; return api; }

const I = id => [0,id,0,0], W = id => [1,id,0,0], A = id => [2,id,0,0], Ic = (id,p)=>[0,id,1,p];

// ---------- goods ----------
const generalGoods = [I(1),I(2),I(3),I(4),I(5),I(6),I(7),I(8),I(9),I(10)];
const WEAPONS_G = [1,2,3,4,5,6,7,8,9,10,11,12].map(W);
const ARMORS_G  = [1,2,3,4,5,6,7,8,9,10,11,12,13].map(A);
const POTIONS_G = [1,2,3,4,5,6,7,8,9,10].map(I);
const MAGIC_G   = [I(4),A(5),A(7),A(11),I(13),I(14)];
const RACE_SHOPS = {
  1:{who:'Варварская лавка', goods:[I(1),I(2),I(7),W(4),A(13),I(11),I(12)]},
  2:{who:'Эльфийская лавка',  goods:[I(2),I(4),W(7),W(10),A(12),A(11),I(15),I(16)]},
  3:{who:'Лавка магов',       goods:[I(4),W(6),A(5),A(7),A(11),I(13),I(14)]},
  4:{who:'Гномья кузня',      goods:[I(2),W(3),W(4),W(11),A(9),A(2),A(4),A(10)]},
  5:{who:'Лавка драконидов',  goods:[I(3),W(12),W(2),A(9),I(13),I(17)]},
  6:{who:'Золотое хранилище', goods:[I(3),I(17),I(18),I(19),A(9),A(11),A(10)]},
};
const blackGoods = [Ic(15,600),Ic(16,600),Ic(17,1200),Ic(18,1200),Ic(19,1800)];

// ---------- event helper ----------
const route = { list:[{code:0,parameters:[]}], repeat:true, skippable:false, wait:false };
const img = (name,idx=0)=>({tileId:0,characterName:name,direction:2,pattern:1,characterIndex:idx});
const cond = ()=>({actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0});
function event(id,name,x,y,image,list,trigger=0,priority=1){
  return {id,name,note:'',x,y,pages:[{conditions:cond(),directionFix:false,image,list,moveFrequency:3,moveRoute:route,moveSpeed:3,moveType:0,priorityType:priority,stepAnime:false,through:false,trigger,walkAnime:true}]};
}

// ---------- interior room builder ----------
const A2 = k => 2048 + k * 48;     // shape0
function room(title) {
  const W_ = 13, H_ = 9;
  const map = { autoplayBgm:true, autoplayBgs:false, battleback1Name:'', battleback2Name:'',
    bgm:{name:'Town2',pan:0,pitch:100,volume:75}, bgs:{name:'',pan:0,pitch:100,volume:90},
    disableDashing:false, displayName:title, encounterList:[], encounterStep:30, height:H_,
    note:'', parallaxLoopX:false, parallaxLoopY:false, parallaxName:'', parallaxShow:true,
    parallaxSx:0, parallaxSy:0, scrollType:0, specifyBattleback:false, tilesetId:3, width:W_,
    data:new Array(W_*H_*6).fill(0), events:[null] };
  fillLayer(map,0,A2(16));                                  // wood floor
  fillRect(map,0,0,W_,2,0,A2(25));                          // top brick wall (2 rows)
  fillRect(map,0,0,1,H_,0,A2(25)); fillRect(map,W_-1,0,1,H_,0,A2(25)); fillRect(map,0,H_-1,W_,1,0,A2(25));
  fillRect(map,6,H_-1,1,1,0,A2(16));                        // doorway gap at bottom-center
  // stocked shelves (2-tall) along back-left and back-right (ids: tops 52-54, bottoms 60-62)
  for (let i = 0; i < 3; i++) { setT(map,1+i,2,2,52+i); setT(map,1+i,3,2,60+i);
                                 setT(map,9+i,2,2,52+i); setT(map,9+i,3,2,60+i); }
  // counter cabinet behind the keeper (ids 48-50)
  setT(map,5,2,2,48); setT(map,6,2,2,49); setT(map,7,2,2,50);
  // barrels in the front corners (id 201)
  setT(map,1,6,2,201); setT(map,11,6,2,201);
  return map;
}

// ---------- build the three shops ----------
const SHOPS = [
  { mapId:3, title:'Общий рынок', label:'Общий рынок', keeper:'People2', kidx:0, cityDoor:[4,7], cityBack:[4,8],
    logic: CL().text(['\\n<Торговец>Чем интересуешься?'])
      .choices(['Оружие', 'Броня', 'Зелья и еда', 'Магия', 'Уйти'])
        .when(0, 'Оружие').shop(WEAPONS_G).whenEnd()
        .when(1, 'Броня').shop(ARMORS_G).whenEnd()
        .when(2, 'Зелья и еда').shop(POTIONS_G).whenEnd()
        .when(3, 'Магия').shop(MAGIC_G).whenEnd()
        .when(4, 'Уйти').whenEnd()
      .choiceEnd().stop().done() },
  { mapId:4, title:'Расовый магазин', label:'Расовая лавка', keeper:'People1', kidx:2, cityDoor:[21,7], cityBack:[21,8],
    logic: (()=>{ const c=CL(); for(const [r,s] of Object.entries(RACE_SHOPS)){ c.ifVar(1,Number(r)); c.text([`\\n<${s.who}>Товары для своих.`]).shop(s.goods); c.end(); } return c.stop().done(); })() },
  { mapId:5, title:'Чёрный рынок', label:'Чёрный рынок', keeper:'People4', kidx:1, cityDoor:[4,16], cityBack:[4,17],
    logic: CL().ifSwitch(2,true).text(['\\n<Контрабандист>Запретное. Тройная цена.']).shop(blackGoods,false)
      .script("$gameSwitches.setValue(50, Math.random()<0.25);\nif ($gameSwitches.value(50)) $gameVariables.setValue(3, Math.min(100,$gameVariables.value(3)+10));")
      .ifSwitch(50,true).text(['ОБЛАВА! Подозрение +10.']).end()
      .else_().text(['Пусто. Найди проводника.']).end().stop().done() },
];

const mapinfos = read('MapInfos');
for (const s of SHOPS) {
  const map = room(s.title);
  // shopkeeper behind the counter area (top-center), faces down
  map.events[1] = event(1, 'Продавец', 6, 3, img(s.keeper, s.kidx), s.logic);
  // exit at the bottom doorway -> back to city in front of the building
  map.events[2] = event(2, 'Выход', 6, 8, { tileId:0, characterName:'', direction:2, pattern:1, characterIndex:0 },
    CL().transfer(2, s.cityBack[0], s.cityBack[1], 2).stop().done(), 2 /* player touch */);
  write(`Map00${s.mapId}`, map);
  mapinfos[s.mapId] = { id:s.mapId, expanded:false, name:s.title, order:s.mapId, parentId:2, scrollX:0, scrollY:0 };
  savePreview(map, 3, `_build/preview_shop${s.mapId}.png`, 2);
}
write('MapInfos', mapinfos);

// ---------- city building doors -> transfers into interiors ----------
const city = read('Map002');
for (const s of SHOPS) {
  const cityEv = city.events.find(e => e && e.id === s.mapId); // shop mapId 3/4/5 == city event id 3/4/5
  if (!cityEv) continue;
  cityEv.x = s.cityDoor[0]; cityEv.y = s.cityDoor[1];
  cityEv.pages[0].image = { tileId:0, characterName:'', direction:2, pattern:1, characterIndex:0 };
  const list = CL().transfer(s.mapId, 6, 7, 8).stop().done();
  list.unshift({ code:408, indent:0, parameters:['<Always Show Mini Label>'] });
  list.unshift({ code:108, indent:0, parameters:[`<Mini Label: ${s.label}>`] });
  cityEv.pages[0].list = list;
}
write('Map002', city);

console.error('Interiors Map003/004/005 built; city doors -> transfers; MapInfos updated.');
