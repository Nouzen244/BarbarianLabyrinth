// gen_town.mjs — FULL city rebuild. Owns Map002 (city) and all shop interiors
// (Map003-005, 018-022) plus every city event's logic. Runs LAST so it overrides
// the older city/interior generators; non-city data (labyrinth, suspicion CE,
// companion actor) is left untouched.
import fs from 'node:fs';
import { fillLayer, fillRect, wallRect, setT, savePreview } from './maplib.mjs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

// ---------------- command DSL ----------------
const wrap=(ls,max=30)=>{const o=[];for(const ln of ls){if(ln.length<=max){o.push(ln);continue;}let c='';for(const w of ln.split(' ')){if((c+' '+w).trim().length>max){if(c)o.push(c);c=w;}else c=(c?c+' ':'')+w;}if(c)o.push(c);}return o;};
function CL(){const L=[];let ind=0;const p=(code,par=[])=>L.push({code,indent:ind,parameters:par});
  const api={
    text(ls){p(101,['',0,0,2]);for(const t of wrap(ls))p(401,[t]);return api;},
    choices(o,cancel=o.length-1){p(102,[o,cancel,0,2,0]);return api;}, when(i,l){p(402,[i,l]);ind++;return api;}, whenEnd(){ind--;return api;}, choiceEnd(){p(404);return api;},
    ifVar(v,val,cmp=0){p(111,[1,v,0,val,cmp]);ind++;return api;}, ifSwitch(s,on=true){p(111,[0,s,on?0:1]);ind++;return api;}, ifGold(a){p(111,[7,a,0]);ind++;return api;}, else_(){ind--;p(411);ind++;return api;}, end(){ind--;p(412);return api;},
    shop(g){p(302,[...g[0],false]);for(let i=1;i<g.length;i++)L.push({code:605,indent:ind,parameters:g[i]});return api;},
    gold(d){p(125,[d>=0?0:1,0,Math.abs(d)]);return api;}, giveItem(id,q=1){p(126,[id,0,0,q]);return api;},
    setSwitch(s,on=true){p(121,[s,s,on?0:1]);return api;}, setVar(v,val){p(122,[v,v,0,0,val]);return api;}, addVar(v,d){p(122,[v,v,d>=0?1:2,0,Math.abs(d)]);return api;},
    party(actorId,add=true){p(129,[actorId,add?0:1,false]);return api;}, transfer(m,x,y,dir=2){p(201,[0,m,x,y,dir,0]);return api;},
    transferVar(vm,vx,vy,dir=2){p(201,[1,vm,vx,vy,dir,0]);return api;},   // map/x/y from variables
    script(code){const a=code.split('\n');p(355,[a[0]]);for(let i=1;i<a.length;i++)p(655,[a[i]]);return api;},
    label(t,range=0){L.unshift({code:408,indent:0,parameters:[range?`<Mini Label Range: ${range}>`:'<Always Show Mini Label>']});L.unshift({code:108,indent:0,parameters:[`<Mini Label: ${t}>`]});return api;},
    stop(){p(0);return api;}, done(){return L;} }; return api; }

const I=id=>[0,id,0,0], W=id=>[1,id,0,0], A=id=>[2,id,0,0], Ic=(id,p)=>[0,id,1,p];
const route={list:[{code:0,parameters:[]}],repeat:true,skippable:false,wait:false};
const spr=(n,i=0)=>({tileId:0,characterName:n,direction:2,pattern:1,characterIndex:i});
const invis=()=>({tileId:0,characterName:'',direction:2,pattern:1,characterIndex:0});
const cond=(sw)=>({actorId:1,actorValid:false,itemId:1,itemValid:false,selfSwitchCh:'A',selfSwitchValid:!!sw,switch1Id:1,switch1Valid:false,switch2Id:1,switch2Valid:false,variableId:1,variableValid:false,variableValue:0});
function pg(image,list,trigger,priority,sw){return {conditions:cond(sw),directionFix:false,image,list,moveFrequency:3,moveRoute:route,moveSpeed:3,moveType:0,priorityType:priority,stepAnime:false,through:false,trigger,walkAnime:true};}
function ev(id,name,x,y,image,list,trigger=0,priority=1){return {id,name,note:'',x,y,pages:[pg(image,list,trigger,priority,false)]};}

// ---------------- tiles ----------------
const GRASS=2816, COBBLE=1584, WALL=61, ROOF=48, STONE=50, DOOR=[48,56], TREE=[102,110];
const W_=41, H_=35, GATE=[19,20,21];     // gate road columns (centre)

// ---------------- goods ----------------
const WEAPONS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(W);
const ARMORS=[1,2,3,4,5,6,7,8,9,10,11,12,13].map(A);
const POTIONS=[1,2,3,4,5,6,7,8,9,10].map(I);
const MAGIC=[W(6),W(13),I(4),A(5),A(7),A(11),I(13),I(14)];
const ESSENCES=[I(11),I(12),I(13),I(14),I(15),I(16),I(17),I(18),I(19)];
const RACE_GOODS={1:[I(1),I(2),I(7),W(4),A(13),I(11),I(12)],2:[I(2),I(4),W(15),W(14),W(7),A(12),A(11),I(15),I(16)],3:[I(4),W(6),W(13),A(5),A(7),A(11),I(13),I(14)],4:[I(2),W(3),W(4),W(11),A(9),A(2),A(4),A(10)],5:[I(3),W(12),W(2),A(9),I(13),I(17)],6:[I(3),I(17),I(18),I(19),A(9),A(11),A(10)]};
const RACE_NAME={1:'Варварская',2:'Эльфийская',3:'Магов',4:'Гномья',5:'Драконидов',6:'Хранилище'};
const BLACK=[Ic(15,600),Ic(16,600),Ic(17,1200),Ic(18,1200),Ic(19,1800)];

// ---------------- interior room ----------------
const A2=k=>2048+k*48;
function room(title,keeperSpr,keeperLogic,cityBack){
  const W2=13,H2=9;
  const m={autoplayBgm:true,autoplayBgs:false,battleback1Name:'',battleback2Name:'',bgm:{name:'Town2',pan:0,pitch:100,volume:75},bgs:{name:'',pan:0,pitch:100,volume:90},
    disableDashing:false,displayName:title,encounterList:[],encounterStep:30,height:H2,note:'',parallaxLoopX:false,parallaxLoopY:false,parallaxName:'',parallaxShow:true,parallaxSx:0,parallaxSy:0,
    scrollType:0,specifyBattleback:false,tilesetId:3,width:W2,data:new Array(W2*H2*6).fill(0),events:[null]};
  fillLayer(m,0,A2(16)); fillRect(m,0,0,W2,2,0,A2(25)); fillRect(m,0,0,1,H2,0,A2(25)); fillRect(m,W2-1,0,1,H2,0,A2(25)); fillRect(m,0,H2-1,W2,1,0,A2(25)); fillRect(m,6,H2-1,1,1,0,A2(16));
  for(let i=0;i<3;i++){setT(m,1+i,2,2,52+i);setT(m,1+i,3,2,60+i);setT(m,9+i,2,2,52+i);setT(m,9+i,3,2,60+i);}
  setT(m,5,2,2,48);setT(m,6,2,2,49);setT(m,7,2,2,50);
  setT(m,1,6,2,201);setT(m,11,6,2,201);
  m.events[1]=ev(1,'Продавец',6,3,keeperSpr,keeperLogic);
  m.events[2]=ev(2,'Выход',6,8,invis(),CL().transfer(2,cityBack[0],cityBack[1],2).stop().done(),2);
  return m;
}

// ---------------- shops: [interior mapId, title, label, keeperSpr, doorXY, keeperLogic] ----------------
const SHOPS=[
  {mid:3, label:'Оружейник', spr:spr('People2',0), door:[6,8], logic:CL().text(['\\n<Оружейник>Чем помочь?'])
      .choices(['Купить','Ковать оружие (+N)','Уйти'],2)
        .when(0,'Купить').shop(WEAPONS).whenEnd()
        .when(1,'Ковать оружие (+N)').script('window.upgradePreview("weapon");').text(['\\n<Оружейник>Куём:','\\V[88]','\\V[89]'])
          .choices(['Ковать','Отмена'],1)
            .when(0,'Ковать').script('window.tryUpgrade("weapon");').text(['\\V[88]']).whenEnd()
            .when(1,'Отмена').whenEnd()
          .choiceEnd().whenEnd()
        .when(2,'Уйти').whenEnd()
      .choiceEnd().stop().done()},
  {mid:19,label:'Бронник',   spr:spr('People1',3), door:[6,16], logic:CL().text(['\\n<Бронник>Чем помочь?'])
      .choices(['Купить','Ковать броню (+N)','Уйти'],2)
        .when(0,'Купить').shop(ARMORS).whenEnd()
        .when(1,'Ковать броню (+N)').script('window.upgradePreview("armor");').text(['\\n<Бронник>Куём:','\\V[88]','\\V[89]'])
          .choices(['Ковать','Отмена'],1)
            .when(0,'Ковать').script('window.tryUpgrade("armor");').text(['\\V[88]']).whenEnd()
            .when(1,'Отмена').whenEnd()
          .choiceEnd().whenEnd()
        .when(2,'Уйти').whenEnd()
      .choiceEnd().stop().done()},
  {mid:20,label:'Аптека',    spr:spr('People2',5), door:[6,24], logic:CL().text(['\\n<Аптекарь>Зелья, еда, бинты.']).shop(POTIONS).stop().done()},
  {mid:21,label:'Магия',     spr:spr('People3',4), door:[34,8], logic:CL().text(['\\n<Маг>Свитки и реагенты.']).shop(MAGIC).stop().done()},
  {mid:22,label:'Эссенции',  spr:spr('People3',1), door:[34,16], logic:CL().text(['\\n<Знаток эссенций>Сила монстров.']).shop(ESSENCES).stop().done()},
  {mid:4, label:'Расовая лавка', spr:spr('People1',0), door:[34,24], logic:(()=>{const c=CL();for(const r of [1,2,3,4,5,6]){c.ifVar(1,r);c.text([`\\n<${RACE_NAME[r]} лавка>Для своих.`]).shop(RACE_GOODS[r]);c.end();}return c.stop().done();})()},
  {mid:18,label:'Таверна',   spr:spr('People1',1), door:[6,32], logic:CL().label('Таверна').text(['\\n<Трактирщик>Чего желаешь?'])
      .choices(['Отдохнуть (50)','Слухи','Уйти'],2)
        .when(0,'Отдохнуть (50)').ifGold(50).gold(-50).script('$gameParty.members().forEach(function(a){a.setHp(a.mhp);a.setMp(a.mmp);[4,17,18,19,20,21].forEach(function(s){a.removeState(s);});});').setVar(11,0).setVar(12,100).text(['Ты выспался. Силы и рассудок восстановлены.']).else_().text(['Нет денег.']).end().whenEnd()
        .when(1,'Слухи').script("var R=['На глубоких этажах правят Монархи.','В разломах прячут редкие эссенции.','Усиленные твари светятся красным — бей насмерть.','Фиолетовое сияние — метка элиты. Беги или умри.','Под Пеклом ледяной склеп сковал Мерзлоту.','На 50-м этаже спит Владыка Бездны.','Маска предков прячет тебя от стражи.','Печать Первородного даёт лишний слот эссенций.','Голод сводит с ума быстрее усталости.','Говорят, слей три одинаковых — выйдет лучше.','Жёлтое снаряжение — легенда, почти миф.','Сон до утра — и Лабиринт впустит снова.'];$gameVariables.setValue(85,R[Math.floor(Math.random()*R.length)]);").text(['\\n<Трактирщик>\\V[85]']).whenEnd()
        .when(2,'Уйти').whenEnd()
      .choiceEnd().stop().done()},
  {mid:5, label:'Чёрный рынок', spr:spr('People3',2), door:[34,32], logic:CL().ifSwitch(2,true).text(['\\n<Контрабандистка>Запретное. Тройная цена.']).shop(BLACK)
      .script('$gameSwitches.setValue(50, Math.random()<0.25);\nif ($gameSwitches.value(50)) $gameVariables.setValue(3, Math.min(100,$gameVariables.value(3)+10));')
      .ifSwitch(50,true).text(['ОБЛАВА! Подозрение +10.']).end()
      .else_().text(['Дверь заколочена. Найди проводника.']).end().stop().done()},
];

// ---------------- build the city map ----------------
const map={autoplayBgm:true,autoplayBgs:false,battleback1Name:'',battleback2Name:'',bgm:{name:'Town1',pan:0,pitch:100,volume:80},bgs:{name:'',pan:0,pitch:100,volume:90},
  disableDashing:false,displayName:'Рафдония',encounterList:[],encounterStep:30,height:H_,note:'',parallaxLoopX:false,parallaxLoopY:false,parallaxName:'',parallaxShow:true,parallaxSx:0,parallaxSy:0,
  scrollType:0,specifyBattleback:false,tilesetId:2,width:W_,data:new Array(W_*H_*6).fill(0),events:[null]};
// grass square with cobbled walkways (both are A-tiles -> render faithfully)
fillLayer(map,0,GRASS);
fillRect(map,GATE[0],0,3,H_,0,COBBLE);                // central avenue: gate -> spawn
for(const s of SHOPS){ const dx=s.door[0], lo=Math.min(dx,GATE[0]), hi=Math.max(dx,GATE[2]);
  fillRect(map, lo, s.door[1], hi-lo+1, 2, 0, COBBLE);   // branch path from each door to the avenue
}
// north wall + gate opening
wallRect(map,0,0,W_,2,STONE,1); fillRect(map,GATE[0],0,3,2,1,0);
// flanking towers (symmetric: gap-tower-gap around the gate road)
function tower(ox){for(let r=0;r<5;r++)for(let c=0;c<2;c++)setT(map,ox+c,r,2,384+(6+r)*8+c);}
tower(GATE[0]-3); tower(GATE[2]+2);
// buildings (door at base). Two well-separated columns: west x6, east x34.
function building(cx,topY){const bx=cx-2;wallRect(map,bx,topY,6,2,ROOF,1);wallRect(map,bx,topY+2,6,3,WALL,1);setT(map,cx,topY+3,2,DOOR[0]);setT(map,cx,topY+4,2,DOOR[1]);}
for(const s of SHOPS) building(s.door[0], s.door[1]-4);
// trees down the two grass edges + garden clusters in the grass plots between paths
for(const ty of [4,9,14,19,24,29,33]){setT(map,0,ty-1,2,TREE[0]);setT(map,0,ty,2,TREE[1]);setT(map,W_-1,ty-1,2,TREE[0]);setT(map,W_-1,ty,2,TREE[1]);}
for(const [tx,ty] of [[12,13],[16,13],[24,13],[28,13],[12,21],[16,21],[24,21],[28,21],[12,29],[16,29],[24,29],[28,29]]){setT(map,tx,ty-1,2,TREE[0]);setT(map,tx,ty,2,TREE[1]);}

// (Outside_B props like lamps/flowers render unpredictably here, so the plaza is
//  kept to confirmed tiles: cobble paths + trees only.)

// ---------------- city events ----------------
const lit=t=>{const e=ev(0,'',0,0,invis(),[]);return e;}; // placeholder unused
let evid=1;
const add=(name,x,y,image,list,trigger=0,priority=1)=>{map.events[evid]=ev(evid,name,x,y,image,list,trigger,priority);evid++;};
// shop door events (invisible, labelled, transfer inside)
for(const s of SHOPS){
  const inside=CL().label(s.label).transfer(s.mid,6,7,8).stop().done();
  add(s.label,s.door[0],s.door[1],invis(),inside,0,1);
}
// gate -> labyrinth (with the open-cycle check + day counter)
add('Лабиринт',GATE[1],3,invis(),
  CL().label('Лабиринт').script('$gameVariables.setValue(81, window.labCheck ? window.labCheck() : 0);')
    .ifVar(81,0,0)
      .script('var v=$gameVariables; var f=Math.max(1,v.value(5)); v.setValue(82,100+f); v.setValue(83,8); v.setValue(84,10);')
      .setSwitch(3,true).text(['Ты входишь в Лабиринт.','Глубочайший этаж: \\V[5].']).transferVar(82,83,84,8)
    .else_().text(['Лабиринт закрыт.','Откроется через \\V[81] мин.']).end().stop().done(),0,1);
// NPCs
add('Глашатай',17,33,spr('People4',0),CL().label('Глашатай').script("var R=['Добро пожаловать в Рафдонию, чужак.','Врата на север ведут в Лабиринт.','Снаряжайся в лавках перед спуском.','Стража следит за чужаками — веди себя тихо.','Говорят, ты не из наших земель...','Кто покорит 50 этажей — станет легендой.'];$gameVariables.setValue(86,R[Math.floor(Math.random()*R.length)]);").text(['\\n<Глашатай>\\V[86]']).stop().done());
add('Стражник',13,11,spr('People1',0),CL().label('Стражник')
  .ifVar(3,60,1).text(['\\n<Стражник>Я слежу за каждым шагом, чужак.'])
  .else_().ifVar(3,30,1).text(['\\n<Стражник>Ты какой-то странный...'])
    .else_().text(['\\n<Стражник>Доброго дня. Веди себя достойно.']).end()
  .end().stop().done());
add('Горожанка',27,11,spr('People2',1),CL().label('Горожанка')
  .text(['\\n<Горожанка>Расскажешь, что знаешь о Лабиринте?'])
  .choices(['Поделиться знанием','Промолчать'],1)
    .when(0,'Поделиться знанием').text(['Ты говоришь то, чего знать не мог...']).addVar(3,15).text(['Горожанка отшатнулась. (+15 подозрения)']).whenEnd()
    .when(1,'Промолчать').text(['...Лучше промолчать.']).whenEnd()
  .choiceEnd().stop().done());
add('Старейшина',13,19,spr('People2',2),CL().label('Старейшина [Маска]')
  .ifSwitch(22,false).text(['\\n<Старейшина>Прими Маску предков.']).giveItem(22,1).setSwitch(22,true).text(['Получена Маска варвара (−30 подозрения).'])
  .else_().text(['\\n<Старейшина>Маска уже у тебя.']).end().stop().done());
add('Хранитель',27,19,spr('People4',3),CL().label('Хранитель [Печать]')
  .ifSwitch(21,false).text(['\\n<Хранитель>Печать Первородного. 3000 золота.'])
    .choices(['Купить (3000)','Отказаться'],1)
      .when(0,'Купить (3000)').ifGold(3000).gold(-3000).giveItem(21,1).setSwitch(21,true).text(['Печать твоя. +1 слот эссенций при использовании.']).else_().text(['Не хватает золота.']).end().whenEnd()
      .when(1,'Отказаться').whenEnd()
    .choiceEnd()
  .else_().text(['\\n<Хранитель>Печать уже продана.']).end().stop().done());
add('Контрабандистка',29,30,spr('People3',3),CL().label('Контрабандист [Ч.Р.]')
  .ifSwitch(2,false).text(['\\n<Контрабандистка>Ищешь запретное? Проведу за молчание.'])
    .choices(['Договориться','Уйти'],1)
      .when(0,'Договориться').setSwitch(2,true).text(['Чёрный рынок открыт. Берегись облав.']).whenEnd()
      .when(1,'Уйти').whenEnd()
    .choiceEnd()
  .else_().text(['\\n<Контрабандистка>Проход открыт.']).end().stop().done());
add('Алхимик',23,30,spr('People3',4),CL().label('Алхимик [Возвышение]')
  .text(['\\n<Алхимик>Возвышу твоё добро. Выбери сам, что слить — по 3 одной редкости.'])
  .choices(['Слить оружие','Слить броню','Слить эссенции','Уйти'],3)
    .when(0,'Слить оружие').script('$gameTemp._mergeMode="weapon"; SceneManager.push(Scene_Merge);').whenEnd()
    .when(1,'Слить броню').script('$gameTemp._mergeMode="armor"; SceneManager.push(Scene_Merge);').whenEnd()
    .when(2,'Слить эссенции').script('$gameTemp._mergeMode="essence"; SceneManager.push(Scene_Merge);').whenEnd()
    .when(3,'Уйти').whenEnd()
  .choiceEnd().stop().done());

// townsfolk wander (random movement); shop doors and the gate stay put
const WANDER = ['Глашатай','Стражник','Горожанка','Старейшина','Хранитель','Контрабандистка'];
for (const e of map.events) if (e && WANDER.includes(e.name)) { e.pages[0].moveType = 1; e.pages[0].moveFrequency = 3; e.pages[0].moveSpeed = 3; }
map.events.length = evid;     // trim
write('Map002', map);

// ---------------- interiors ----------------
for(const s of SHOPS){
  const back=[s.door[0], s.door[1]+1];               // step out below the door
  const m=room(s.label, s.spr, s.logic, back);
  // black-market interior also holds the buyable slave companion Кай
  if (s.mid===5){
    m.events[3]=ev(3,'Раб',10,4,spr('People4',2),CL().label('Раб [компаньон]')
      .ifSwitch(23,false).text(['\\n<Раб Кай>Выкупишь — буду биться за тебя.','Цена: 1500 золота.'])
        .choices(['Выкупить','Уйти'],1)
          .when(0,'Выкупить').ifGold(1500).gold(-1500).party(2,true).setSwitch(23,true).text(['Кай в твоём отряде!']).else_().text(['Не хватает золота.']).end().whenEnd()
          .when(1,'Уйти').whenEnd()
        .choiceEnd()
      .else_().text(['\\n<Раб Кай>Я уже с тобой.']).end().stop().done());
  }
  write('Map'+String(s.mid).padStart(3,'0'), m);
}

// ---------------- MapInfos ----------------
const mi=read('MapInfos');
mi[2]={id:2,expanded:true,name:'Рафдония',order:2,parentId:0,scrollX:0,scrollY:0};
for(const s of SHOPS) mi[s.mid]={id:s.mid,expanded:false,name:s.label,order:s.mid,parentId:2,scrollX:0,scrollY:0};
write('MapInfos', mi);

savePreview(map, 2, '_build/preview_town.png', 1);
console.error('gen_town: city', W_+'x'+H_, '| shops:', SHOPS.length, '| events:', evid-1);
