// PHASE 7 (vertical slice) — floor-1 enemies, troops, and repeatable test
// encounters on Map001. Preserves the char-creation event (Map001 event 1).
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const EL_PHYS = 1;
// enemy params: [MHP,MMP,ATK,DEF,MAT,MDF,AGI,LUK]
function enemy(id, name, battler, params, exp, gold, drops) {
  return {
    id, name, battlerName: battler, battlerHue: 0,
    actions: [{ conditionParam1: 0, conditionParam2: 0, conditionType: 0, rating: 5, skillId: 1 }],
    dropItems: drops.length ? drops : [{ dataId: 1, denominator: 1, kind: 0 }],
    exp, gold, params, note: '',
    traits: [
      { code: 22, dataId: 0, value: 0.95 }, // hit
      { code: 22, dataId: 1, value: 0.05 }, // eva
      { code: 31, dataId: EL_PHYS, value: 0 }, // attack element physical
    ],
  };
}
const drop = (itemId, denom) => ({ dataId: itemId, denominator: denom, kind: 1 }); // kind 1 = item

const ENEMIES = [null,
  enemy(1, 'Гоблин',        'Imp',      [80, 0, 18, 10, 6, 8, 12, 6],  8,  12, [drop(11, 3), drop(1, 5)]),
  enemy(2, 'Крыса-мутант',  'Rat',      [50, 0, 14, 6, 4, 6, 22, 6],   5,  6,  [drop(12, 3)]),
  enemy(3, 'Скелет',        'Skeleton', [120, 0, 22, 16, 4, 10, 8, 4], 12, 18, [drop(15, 4), drop(1, 4)]),
  enemy(4, 'Слизень',       'Slime',    [70, 0, 12, 8, 8, 14, 6, 4],   6,  8,  [drop(1, 3), drop(4, 6)]),
  enemy(5, 'Орк-громила',   'Orc',      [260, 0, 34, 20, 6, 12, 10, 6],35, 60, [drop(18, 2), drop(2, 3)]),
];
write('Enemies', ENEMIES);

// ---- troops ----
function troop(id, name, members) {
  return { id, name, members,
    pages: [{ conditions: { actorHp: 50, actorId: 1, actorValid: false, enemyHp: 50,
      enemyIndex: 0, enemyValid: false, switchId: 1, switchValid: false, turnA: 0, turnB: 0,
      turnEnding: false, turnValid: false }, list: [{ code: 0, indent: 0, parameters: [] }], span: 0 }] };
}
const mem = (enemyId, x, y) => ({ enemyId, x, y, hidden: false });
const TROOPS = [null,
  troop(1, 'Гоблин',          [mem(1, 408, 340)]),
  troop(2, 'Крысы x2',        [mem(2, 320, 360), mem(2, 496, 360)]),
  troop(3, 'Гоблин и Скелет', [mem(1, 320, 340), mem(3, 504, 360)]),
  troop(4, 'Орк-громила',     [mem(5, 408, 320)]),
];
write('Troops', TROOPS);

// ---- give magic-capable classes a basic spell so combat is fair for casters ----
// (uses stock skills Fire=9, Heal=8; proper class skill trees come later)
const classes = read('Classes');
for (let i = 1; i < classes.length; i++) {
  const c = classes[i];
  const hasMagic = c.traits.some(t => t.code === 41 && t.dataId === 1); // Add Skill Type: Magic
  const learn = [];
  if (hasMagic) { learn.push({ level: 1, skillId: 9, note: '' }); learn.push({ level: 3, skillId: 8, note: '' }); }
  c.learnings = learn;
}
write('Classes', classes);

// (Map001 is now the clean awakening chamber built in gen_phase5; the old
//  training encounters were replaced by the real labyrinth in gen_phase10.)

console.error('Enemies:', ENEMIES.length - 1, '| Troops:', TROOPS.length - 1);
