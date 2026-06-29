// EXTRAS — companion (buy the slave Кай in the black market) + a tavern
// (city building + interior with rest & rumors). Runs after gen_city/interiors.
import fs from 'node:fs';
import { fillLayer, fillRect, wallRect, setT, savePreview } from './maplib.mjs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const wrap=(ls,max=30)=>{const o=[];for(const ln of ls){if(ln.length<=max){o.push(ln);continue;}let c='';for(const w of ln.split(' ')){if((c+' '+w).trim().length>max){if(c)o.push(c);c=w;}else c=(c?c+' ':'')+w;}if(c)o.push(c);}return o;};
function CL(){const L=[];let ind=0;const p=(c,par=[])=>L.push({code:c,indent:ind,parameters:par});
  const api={ text(ls){p(101,['',0,0,2]);for(const t of wrap(ls))p(401,[t]);return api;},
    choices(o){p(102,[o,0,0,2,0]);return api;}, when(i,l){p(402,[i,l]);ind++;return api;}, whenEnd(){ind--;return api;}, choiceEnd(){p(404);return api;},
    ifGold(a){p(111,[7,a,0]);ind++;return api;}, else_(){ind--;p(411);ind++;return api;}, end(){ind--;p(412);return api;},
    ifSwitch(s,on=true){p(111,[0,s,on?0:1]);ind++;return api;},
    gold(d){p(125,[d>=0?0:1,0,Math.abs(d)]);return api;}, setSwitch(s,on=true){p(121,[s,s,on?0:1]);return api;}, setVar(v,val){p(122,[v,v,0,0,val]);return api;},
    party(actorId,add=true){p(129,[actorId,add?0:1,false]);return api;}, transfer(m,x,y,dir=2){p(201,[0,m,x,y,dir,0]);return api;},
    script(code){const a=code.split('\n');p(355,[a[0]]);for(let i=1;i<a.length;i++)p(655,[a[i]]);return api;},
    label(t){L.unshift({code:408,indent:0,parameters:['<Always Show Mini Label>']});L.unshift({code:108,indent:0,parameters:[`<Mini Label: ${t}>`]});return api;},
    stop(){p(0);return api;}, done(){return L;} }; return api; }
const route={list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false};
const spr=(n,i=0)=>({tileId:0,characterName:n,direction:2,pattern:1,characterIndex:i});
const invis=()=>({tileId:0,characterName:'',direction:2,pattern:1,characterIndex:0});
const cond=()=>({actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:false,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0});
function ev(id,name,x,y,image,list,trigger=0,priority=1){return {id,name,note:'',x,y,pages:[{conditions:cond(),directionFix:false,image,list,moveFrequency:3,moveRoute:route,moveSpeed:3,moveType:0,priorityType:priority,stepAnime:false,through:false,trigger,walkAnime:true}]};}

// ===== 1) companion actor 2 = Кай (раб) =====
const actors = read('Actors');
const k = actors[2];
k.name = 'Кай'; k.nickname = 'Раб'; k.classId = 2; k.initialLevel = 3; k.maxLevel = 99;
k.equips = [2, 1, 0, 0, 0]; k.note = '';
write('Actors', actors);

// ===== 2) slave purchase in the black market interior (Map005) =====
const m5 = read('Map005');
m5.events[3] = ev(3, 'Раб', 10, 4, spr('People4', 2), CL().label('Раб [компаньон]')
  .ifSwitch(23, false)
    .text(['\\n<Раб Кай>Выкупишь — буду биться за тебя.', 'Цена: 1500 золота. Согласен?'])
    .choices(['Выкупить', 'Уйти'])
      .when(0, 'Выкупить')
        .ifGold(1500)
          .gold(-1500).party(2, true).setSwitch(23, true)
          .text(['Кай свободен и сражается за тебя!'])
        .else_().text(['Не хватает золота.']).end()
      .whenEnd()
      .when(1, 'Уйти').whenEnd()
    .choiceEnd()
  .else_().text(['Кай уже в твоём отряде.']).end()
  .stop().done());
write('Map005', m5);

// ===== 3) tavern interior (Map018) =====
const A2 = kk => 2048 + kk * 48;
function room(title) {
  const W=13,H=9;
  const m={ autoplayBgm:true,autoplayBgs:false,battleback1Name:'',battleback2Name:'',bgm:{name:'Town2',pan:0,pitch:100,volume:75},bgs:{name:'',pan:0,pitch:100,volume:90},
    disableDashing:false,displayName:title,encounterList:[],encounterStep:30,height:H,note:'',parallaxLoopX:false,parallaxLoopY:false,parallaxName:'',parallaxShow:true,parallaxSx:0,parallaxSy:0,
    scrollType:0,specifyBattleback:false,tilesetId:3,width:W,data:new Array(W*H*6).fill(0),events:[null] };
  fillLayer(m,0,A2(16)); fillRect(m,0,0,W,2,0,A2(25)); fillRect(m,0,0,1,H,0,A2(25)); fillRect(m,W-1,0,1,H,0,A2(25)); fillRect(m,0,H-1,W,1,0,A2(25)); fillRect(m,6,H-1,1,1,0,A2(16));
  // bar counter (center) + stocked shelves of bottles on both sides (2-tall)
  setT(m,5,2,2,48); setT(m,6,2,2,49); setT(m,7,2,2,50);
  for (let i=0;i<3;i++){ setT(m,1+i,2,2,52+i); setT(m,1+i,3,2,60+i);
                          setT(m,9+i,2,2,52+i); setT(m,9+i,3,2,60+i); }
  return m;
}
const tav = room('Таверна «Последний привал»');
tav.events[1] = ev(1, 'Трактирщик', 6, 3, spr('People1', 1), CL().label('Трактирщик')
  .text(['\\n<Трактирщик>Чего желаешь, путник?'])
  .choices(['Отдохнуть (50)', 'Слухи', 'Уйти'])
    .when(0, 'Отдохнуть (50)')
      .ifGold(50)
        .gold(-50).script('$gameParty.members().forEach(function(a){a.recoverAll();});').setVar(11, 0).setVar(12, 100)
        .text(['Ты выспался. Силы, бодрость и рассудок восстановлены.'])
      .else_().text(['Нет денег на ночлег.']).end()
    .whenEnd()
    .when(1, 'Слухи')
      .text(['Говорят, на 4 этаже бродит Монарх.', 'А в разломах прячут редкие эссенции.'])
    .whenEnd()
    .when(2, 'Уйти').whenEnd()
  .choiceEnd().stop().done());
tav.events[2] = ev(2, 'Выход', 6, 8, invis(), CL().transfer(2, 11, 17, 2).stop().done(), 2);
write('Map018', tav);

// ===== 4) tavern building + door in the city (Map002) =====
const city = read('Map002');
const WALL=61, ROOF=48, DOOR=[48,56];
const bx=9, topY=12, doorX=11;
wallRect(city, bx, topY, 6, 2, ROOF, 1); wallRect(city, bx, topY+2, 6, 3, WALL, 1);
setT(city, doorX, topY+3, 2, DOOR[0]); setT(city, doorX, topY+4, 2, DOOR[1]);
city.events[11] = ev(11, 'Таверна', doorX, 16, invis(), CL().label('Таверна').transfer(18, 6, 7, 8).stop().done(), 0, 1);
write('Map002', city);

// MapInfos for the tavern
const mi = read('MapInfos');
mi[18] = { id:18, expanded:false, name:'Таверна', order:18, parentId:2, scrollX:0, scrollY:0 };
write('MapInfos', mi);

savePreview(tav, 3, '_build/preview_tavern.png', 2);
savePreview(city, 2, '_build/preview_city.png', 2);
console.error('Extras: companion Кай + slave event (Map005 ev3), tavern Map018 + city building/door.');
