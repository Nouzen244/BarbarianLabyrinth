// SURVIVAL tick — parallel CommonEvent 15 (active while Switch 3 / in labyrinth):
// Hunger(10) +2, Fatigue(11) +1, Sanity(12) -1 per tick; applies/removes the
// condition states 19 (Голод), 20 (Истощение), 21 (Безумие) at thresholds.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const scriptLines = [
  "var v=$gameVariables, a=$gameActors.actor(1);",
  "v.setValue(10, Math.min(100, v.value(10)+4));",
  "v.setValue(11, Math.min(100, v.value(11)+2));",
  "v.setValue(12, Math.max(0, v.value(12)-2));",
  "var s=function(c,id){ if(c){ if(!a.isStateAffected(id)) a.addState(id); } else if(a.isStateAffected(id)) a.removeState(id); };",
  "s(v.value(10)>=100,19); s(v.value(11)>=100,20); s(v.value(12)<=0,21);",
];
const list = [{ code: 230, indent: 0, parameters: [240] }];          // Wait ~4s
list.push({ code: 355, indent: 0, parameters: [scriptLines[0]] });
for (let i = 1; i < scriptLines.length; i++) list.push({ code: 655, indent: 0, parameters: [scriptLines[i]] });
list.push({ code: 0, indent: 0, parameters: [] });

const ce = read('CommonEvents');
while (ce.length < 16) ce.push(null);
ce[15] = { id: 15, name: 'Выживание (тик)', switchId: 3, trigger: 2, list };
write('CommonEvents', ce);
console.error('Survival tick: CommonEvent 15 (parallel, Switch 3).');
