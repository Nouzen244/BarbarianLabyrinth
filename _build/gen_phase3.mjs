// PHASE 3 — Items (potions, food, utility, essences, limited), essence-effect
// states (22+), utility/limited common events (6+), Weapons, Armors. Re-runnable.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

// ---------- trait / effect helpers ----------
const tr = {
  param:(id,r)=>({code:21,dataId:id,value:r}),
  xparam:(id,v)=>({code:22,dataId:id,value:v}),
  element:(id,r)=>({code:11,dataId:id,value:r}),
  atkElement:id=>({code:31,dataId:id,value:0}),
};
const ef = {
  hp:(flat,pct=0)=>({code:11,dataId:0,value1:pct,value2:flat}),
  mp:(flat,pct=0)=>({code:12,dataId:0,value1:pct,value2:flat}),
  addState:(id,chance=1)=>({code:21,dataId:id,value1:chance,value2:0}),
  remState:id=>({code:22,dataId:id,value1:1,value2:0}),
  commonEvent:id=>({code:44,dataId:id,value1:0,value2:0}),
};
const P={MHP:0,MMP:1,ATK:2,DEF:3,MAT:4,MDF:5,AGI:6,LUK:7};
const EL={PHYS:1,FIRE:2,ICE:3,THUN:4,WATER:5,EARTH:6,WIND:7,LIGHT:8,DARK:9};

// ===================== ITEM builder =====================
function item(o){return Object.assign({
  id:0,animationId:0,consumable:true,
  damage:{critical:false,elementId:0,formula:'0',type:0,variance:20},
  description:'',effects:[],hitType:0,iconIndex:0,itypeId:1,name:'',note:'',
  occasion:0,price:0,repeats:1,scope:7,speed:0,successRate:100,tpGain:0,
},o);}

const ITEMS=[null,
  item({id:1,name:'Малое зелье',iconIndex:176,price:50,animationId:41,scope:7,effects:[ef.hp(250)],description:'Восстанавливает 250 HP.'}),
  item({id:2,name:'Зелье',iconIndex:176,price:150,animationId:41,scope:7,effects:[ef.hp(600)],description:'Восстанавливает 600 HP.'}),
  item({id:3,name:'Большое зелье',iconIndex:176,price:400,animationId:41,scope:7,effects:[ef.hp(1500)],description:'Восстанавливает 1500 HP.'}),
  item({id:4,name:'Эфир',iconIndex:177,price:200,animationId:41,scope:7,effects:[ef.mp(150)],description:'Восстанавливает 150 MP.'}),
  item({id:5,name:'Чёрствый хлеб',iconIndex:260,price:20,scope:11,effects:[ef.hp(120),ef.commonEvent(6)],description:'Утоляет голод. +120 HP, −Голод.'}),
  item({id:6,name:'Вяленое мясо',iconIndex:259,price:45,scope:11,effects:[ef.hp(280),ef.commonEvent(6)],description:'Сытная еда. +280 HP, −Голод.'}),
  item({id:7,name:'Бинты',iconIndex:192,price:120,scope:7,effects:[ef.hp(150),ef.remState(17),ef.remState(18),ef.remState(133)],description:'Лечит переломы и кровотечение.'}),
  item({id:8,name:'Противоядие',iconIndex:176,price:60,scope:7,effects:[ef.remState(4)],description:'Снимает отравление.'}),
  item({id:9,name:'Факел',iconIndex:188,price:30,occasion:3,consumable:true,description:'Освещает тёмные этажи лабиринта. Используется автоматически.'}),
  item({id:10,name:'Верёвка',iconIndex:243,price:40,occasion:3,consumable:true,description:'Помогает выбраться из ловушек и спуститься в разломы.'}),
  // --- essences (rank in note) ---
  essence(11,'Эссенция Гоблина',26,1,'Кровь гоблина: +10% ATK.'),
  essence(12,'Эссенция Крысы',27,1,'Прыть крысы: +12% AGI.'),
  essence(13,'Эссенция Огня',22,1,'Сила Огня: атаки наносят урон огнём.'),
  essence(14,'Эссенция Пепла',23,1,'Пепельный покров: огнестойкость, +DEF.'),
  essence(15,'Эссенция Тени',24,1,'Тень: +10% уклонение.'),
  essence(16,'Эссенция Ночи',25,1,'Покров Ночи: уклонение и тёмные атаки.'),
  essence(17,'Эссенция Вампира',28,2,'Жажда вампира: восстановление HP каждый ход.'),
  essence(18,'Эссенция Теневого волка',29,2,'Клык волка: +ATK и +AGI.'),
  essence(19,'Эссенция Стража разлома',30,3,'Мощь стража: +8% ко всем боевым статам.'),
  essence(20,'Эссенция Монарха',31,4,'Длань монарха: огромный прирост силы.'),
  // --- limited items (effects via common events) ---
  item({id:21,name:'Печать Первородного',iconIndex:163,price:0,occasion:2,consumable:true,scope:11,effects:[ef.commonEvent(8)],description:'Навсегда +1 слот эссенций. 1 шт. на игру.'}),
  item({id:22,name:'Маска варвара',iconIndex:162,price:0,occasion:2,consumable:true,scope:11,effects:[ef.commonEvent(7)],description:'Снижает Подозрение на 30. 1 шт. на игру.'}),
  item({id:23,name:'Кровь дракона',iconIndex:184,price:0,occasion:2,consumable:true,scope:11,effects:[ef.commonEvent(9)],description:'Временно открывает расовую черту другой расы.'}),
  item({id:24,name:'Осколок Бездны',iconIndex:185,price:0,occasion:2,consumable:true,scope:11,effects:[ef.commonEvent(10)],description:'Позволяет использовать эссенцию 4-го ранга.'}),
  item({id:25,name:'Хроника Рафдонии',iconIndex:228,price:0,itypeId:2,consumable:false,occasion:2,scope:11,effects:[ef.commonEvent(11)],description:'Скрытый лор умирающего мира. Можно перечитывать.'}),
];
function essence(id,name,stateId,rank,desc){
  return item({id,name,iconIndex:79,price:rank*200,scope:11,occasion:0,consumable:false,
    effects:[ef.addState(stateId,1)],note:`<Essence Rank: ${rank}>`,
    description:`[Ранг ${rank}] ${desc}`});
}

// ===================== ESSENCE-EFFECT STATES (22..31) =====================
function pstate(o){return Object.assign({
  id:0,autoRemovalTiming:0,chanceByDamage:100,iconIndex:79,maxTurns:1,minTurns:1,
  motion:0,overlay:0,priority:20,message1:'',message2:'',message3:'',message4:'',
  releaseByDamage:false,removeAtBattleEnd:false,removeByDamage:false,
  removeByRestriction:false,removeByWalking:false,restriction:0,stepsToRemove:100,
  note:'',name:'',traits:[],
},o);}
const ESSENCE_STATES={
  22:pstate({id:22,name:'Сила Огня',iconIndex:64,traits:[tr.atkElement(EL.FIRE),tr.param(P.ATK,1.05)]}),
  23:pstate({id:23,name:'Пепельный покров',iconIndex:64,traits:[tr.element(EL.FIRE,0.8),tr.param(P.DEF,1.05)]}),
  24:pstate({id:24,name:'Тень',iconIndex:78,traits:[tr.xparam(1,0.10)]}),
  25:pstate({id:25,name:'Покров Ночи',iconIndex:78,traits:[tr.xparam(1,0.08),tr.atkElement(EL.DARK)]}),
  26:pstate({id:26,name:'Кровь гоблина',traits:[tr.param(P.ATK,1.10)]}),
  27:pstate({id:27,name:'Прыть крысы',traits:[tr.param(P.AGI,1.12)]}),
  28:pstate({id:28,name:'Жажда вампира',iconIndex:80,traits:[tr.xparam(7,0.08)]}),
  29:pstate({id:29,name:'Клык волка',traits:[tr.param(P.ATK,1.08),tr.param(P.AGI,1.08)]}),
  30:pstate({id:30,name:'Мощь стража',iconIndex:73,traits:[tr.param(P.MHP,1.08),tr.param(P.ATK,1.08),tr.param(P.DEF,1.08),tr.param(P.MAT,1.08),tr.param(P.MDF,1.08)]}),
  31:pstate({id:31,name:'Длань монарха',iconIndex:87,traits:[tr.param(P.MHP,1.20),tr.param(P.ATK,1.15),tr.param(P.MAT,1.15),tr.param(P.AGI,1.10)]}),
};

// ===================== WEAPONS =====================
function weapon(id,name,wtypeId,params,icon,price,desc,extraTraits=[]){
  return {id,animationId:1,description:desc,etypeId:1,
    traits:[tr.atkElement(EL.PHYS),...extraTraits],iconIndex:icon,name,note:'',
    params,price,wtypeId};
}
const pa=(o={})=>{const a=[0,0,0,0,0,0,0,0];for(const k in o)a[P[k]]=o[k];return a;};
const WEAPONS=[null,
  weapon(1,'Ржавый кинжал',1,pa({ATK:8,AGI:2}),97,80,'Лёгкий и быстрый.'),
  weapon(2,'Железный меч',2,pa({ATK:14}),97,300,'Надёжный клинок.'),
  weapon(3,'Цеп',3,pa({ATK:16}),99,320,'Дробящее оружие.'),
  weapon(4,'Боевой топор',4,pa({ATK:20,AGI:-2}),100,420,'Тяжёлый и сокрушительный.'),
  weapon(5,'Хлыст',5,pa({ATK:11,AGI:1}),101,260,'Достаёт на расстоянии.'),
  weapon(6,'Дубовый посох',6,pa({ATK:4,MAT:12,MMP:5}),102,300,'Усиливает магию.'),
  weapon(7,'Короткий лук',7,pa({ATK:12,AGI:3}),103,300,'Стрелковое оружие.'),
  weapon(8,'Арбалет',8,pa({ATK:15}),104,360,'Мощный болт.'),
  weapon(9,'Пистоль',9,pa({ATK:18}),105,500,'Редкое огнестрельное.'),
  weapon(10,'Когти',10,pa({ATK:10,AGI:4}),106,280,'Раздирающие когти.'),
  weapon(11,'Кастет',11,pa({ATK:9,DEF:2}),107,220,'Для ближнего боя.'),
  weapon(12,'Копьё',12,pa({ATK:15,DEF:1}),108,360,'Длинная досягаемость.'),
  weapon(13,'Жезл чародея',6,pa({ATK:3,MAT:16,MMP:8}),102,420,'Концентрирует ману. Жезл магов.'),
  weapon(14,'Эльфийский клинок',2,pa({ATK:13,AGI:4}),98,380,'Лёгкий клинок для стрелка.'),
  weapon(15,'Длинный лук',7,pa({ATK:16,AGI:2}),103,460,'Бьёт дальше и сильнее.'),
];

// ===================== ARMORS =====================
function armor(id,name,etypeId,atypeId,params,icon,price,desc,traits=[]){
  return {id,atypeId,description:desc,etypeId,traits,iconIndex:icon,name,note:'',params,price};
}
const ARMORS=[null,
  // shields (etype2)
  armor(1,'Малый щит',2,5,pa({DEF:6}),128,200,'Лёгкая защита.'),
  armor(2,'Большой щит',2,6,pa({DEF:12,AGI:-3}),129,420,'Тяжёлая защита.'),
  // heads (etype3)
  armor(3,'Кожаный капюшон',3,3,pa({DEF:3,MDF:2}),130,120,'Лёгкий головной убор.'),
  armor(4,'Железный шлем',3,4,pa({DEF:6}),131,260,'Прочный шлем.'),
  armor(5,'Колпак мага',3,2,pa({MDF:5,MMP:10}),132,260,'Для заклинателей.'),
  // bodies (etype4)
  armor(6,'Дорожная одежда',4,1,pa({DEF:4}),135,80,'Подходит каждому.'),
  armor(7,'Холщовая роба',4,2,pa({DEF:3,MDF:6,MAT:3}),136,240,'Магическое облачение.'),
  armor(8,'Кожаный доспех',4,3,pa({DEF:8}),137,280,'Гибкая защита.'),
  armor(9,'Латы',4,4,pa({DEF:16,AGI:-5}),138,560,'Тяжёлая броня.'),
  // accessories (etype5, atype1 — equippable by all)
  armor(10,'Кольцо силы',5,1,pa({ATK:5}),160,300,'+ATK.'),
  armor(11,'Амулет духа',5,1,pa({MAT:5,MMP:10}),161,300,'+MAT, +MP.'),
  armor(12,'Сапоги скорохода',5,1,pa({AGI:6}),162,300,'+AGI.'),
  armor(13,'Оберег варвара',5,1,pa({MHP:200}),163,400,'+200 HP.'),
];

// ===================== COMMON EVENTS 6..11 =====================
function ceScript(id,name,lines){
  const list=[];
  list.push({code:355,indent:0,parameters:[lines[0]]});
  for(let i=1;i<lines.length;i++) list.push({code:655,indent:0,parameters:[lines[i]]});
  list.push({code:0,indent:0,parameters:[]});
  return {id,list,name,switchId:1,trigger:0};
}
function ceMsg(id,name,textLines,scriptLines=[]){
  const list=[];
  for(const s of scriptLines){ // optional leading script
    list.push({code:355,indent:0,parameters:[s]});
  }
  list.push({code:101,indent:0,parameters:['',0,0,2]});
  for(const t of textLines) list.push({code:401,indent:0,parameters:[t]});
  list.push({code:0,indent:0,parameters:[]});
  return {id,list,name,switchId:1,trigger:0};
}

// ===================== WRITE =====================
const items=ITEMS; write('Items',items);
write('Weapons',WEAPONS);
write('Armors',ARMORS);

const states=read('States');
while(states.length<32) states.push(null);
for(const id in ESSENCE_STATES) states[id]=ESSENCE_STATES[id];
write('States',states);

const ce=read('CommonEvents');
while(ce.length<12) ce.push(null);
ce[6]=ceMsg(6,'Съесть еду (−Голод)',['Бьёрн жадно проглатывает еду. Голод отступает.'],
  ['$gameVariables.setValue(10, Math.max(0, $gameVariables.value(10) - 30));']);
ce[7]=ceMsg(7,'Маска варвара (−Подозрение)',['Маска скрывает чужой взгляд. Подозрение спадает на 30.'],
  ['$gameVariables.setValue(3, Math.max(0, $gameVariables.value(3) - 30));']);
ce[8]=ceMsg(8,'Печать Первородного (+слот)',['Печать врастает в плоть. Открыт ещё один слот эссенций.'],
  ['$gameVariables.setValue(24, $gameVariables.value(24) + 1);']);
ce[9]=ceMsg(9,'Кровь дракона (заглушка)',['Кровь дракона обжигает горло...','(Полный эффект — в фазе системы эссенций.)']);
ce[10]=ceMsg(10,'Осколок Бездны (заглушка)',['Бездна смотрит в ответ...','(Полный эффект — на финальных этажах.)']);
ce[11]=ceMsg(11,'Хроника Рафдонии (лор)',[
  'Рафдония — последний город на умирающей земле.',
  'Каждый месяц Лабиринт раскрывается, и из тьмы текут эссенции.',
  'Тех, кто помнит «иной мир», здесь зовут злыми духами и сжигают.']);
write('CommonEvents',ce);

console.error('Items:',items.length-1,'| Weapons:',WEAPONS.length-1,'| Armors:',ARMORS.length-1);
console.error('Essence states 22-31 set | CommonEvents 6-11 set | States len:',states.length-1);
