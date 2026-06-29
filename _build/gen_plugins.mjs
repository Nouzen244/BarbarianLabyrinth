// Regenerates js/plugins.js: parses each YEP plugin header for @param/@default
// (mirrors what the MV Plugin Manager does when you add a plugin), in the
// correct load order. Preserves the stock Community_Basic / MadeWithMv entries.
import fs from 'node:fs';
import path from 'node:path';

const PROJ = 'E:/project/game/BarbarianLabyrinth';
const PLUGDIR = path.join(PROJ, 'js/plugins');
const PLUGINSJS = path.join(PROJ, 'js/plugins.js');

// Desired load order. Stock entries are pulled from the existing plugins.js.
const ORDER = [
  'Community_Basic',          // stock — keep first so YEP_CoreEngine wins on resolution
  'YEP_CoreEngine',
  'YEP_MessageCore',
  'YEP_ItemCore',
  'YEP_X_ItemDiscard',        // "Выбросить" option in the item menu
  'YEP_SkillCore',
  'YEP_BuffsStatesCore',
  'YEP_AutoPassiveStates',    // after BuffsStatesCore + SkillCore
  'YEP_StatusMenuCore',
  'YEP_ClassChangeCore',
  'YEP_ShopMenuCore',
  'YEP_BattleEngineCore',
  'YEP_AbsorptionBarrier',    // shields = barrier over HP (before VisualHpGauge for gauge display)
  'YEP_TargetCore',           // under BattleEngineCore
  'YEP_X_SelectionControl',   // under BattleEngineCore + TargetCore
  'YEP_X_VisualHpGauge',      // enemy HP bars
  'YEP_X_VisualStateFX',      // state icons/animations on battlers
  'YEP_SaveCore',
  'YEP_QuestJournal',
  'YEP_EventMiniLabel',
  'EssenceSlots',             // custom: essence slot cap (parsed from file like YEP)
  'Labyrinth',                // custom: death-in-labyrinth -> back to town
  'LabyrinthCycle',           // custom: 30-min open cycle
  'SurvivalHUD',              // custom: hunger/fatigue/sanity bars
  'LightFog',                 // custom: labyrinth darkness + torch vision circle
  'ClassPreview',             // custom: live look preview on class hover
  'LabyrinthScaling',         // custom: enemies scale with floor depth
  'Rarity',                   // custom: gear rarity (after YEP_ItemCore)
  'Upgrade',                  // custom: gear +N upgrade (after Rarity)
  'Transmute',                // custom: merge-for-rarity (after Rarity)
  'SkillTree',                // custom: attribute + talent tree window
  'CombatExtras',             // custom: skill cooldowns + battle damage preview
  'StatusView',               // custom: in-battle status viewer button
  'BuffScaling',              // custom: buff/debuff potency scales with skill upgrade
  'SideBattleLog',            // custom: persistent battle log window on the right
  'MergeSelect',              // custom: pick-which-3 merge scene (essences/gear)
  'MadeWithMv',               // stock splash — keep last
];
const CUSTOM = new Set(['EssenceSlots', 'Labyrinth', 'LabyrinthCycle', 'SurvivalHUD', 'LightFog', 'ClassPreview', 'LabyrinthScaling', 'Rarity', 'Upgrade', 'Transmute', 'SkillTree', 'CombatExtras', 'StatusView', 'BuffScaling', 'SideBattleLog', 'MergeSelect']);   // non-YEP plugins parsed from their own file

// ---- parse existing plugins.js to preserve stock entries ----
const existingRaw = fs.readFileSync(PLUGINSJS, 'utf8');
const arrStr = existingRaw.slice(existingRaw.indexOf('['), existingRaw.lastIndexOf(']') + 1);
const existing = JSON.parse(arrStr);
const stock = {};
for (const e of existing) stock[e.name] = e;

// ---- header parser ----
function parseHeader(js) {
  // grab the first  /*: ... */  block (English param block)
  const m = js.match(/\/\*:\s*[\r\n]([\s\S]*?)\*\//);
  if (!m) return { desc: '', params: {} };
  const body = m[1];
  const lines = body.split(/\r?\n/).map(l => l.replace(/^\s*\*\s?/, ''));
  const params = {};
  let cur = null;       // current param key
  let mode = null;      // 'default' | 'desc' | null
  let desc = '';
  for (const line of lines) {
    const t = line.replace(/^\s+/, '');
    if (t.startsWith('@param ')) {
      cur = t.slice(7).trim();
      if (!(cur in params)) params[cur] = '';
      mode = null;
    } else if (t.startsWith('@plugindesc')) {
      desc = t.slice('@plugindesc'.length).trim();
      mode = 'desc';
    } else if (t.startsWith('@default')) {
      if (cur !== null) { params[cur] = t.slice('@default'.length).replace(/^\s/, ''); mode = 'default'; }
    } else if (t.startsWith('@')) {
      mode = null;            // any other tag ends accumulation
    } else {
      if (mode === 'default' && cur !== null) params[cur] += '\n' + line;
      else if (mode === 'desc') desc += ' ' + t;
    }
  }
  for (const k of Object.keys(params)) params[k] = params[k].replace(/[ \t\r\n]+$/, '');
  return { desc: desc.trim(), params };
}

// ---- build entries ----
const out = [];
for (const name of ORDER) {
  if (!name.startsWith('YEP_') && !CUSTOM.has(name)) {
    if (stock[name]) {
      const e = stock[name];
      if (name === 'MadeWithMv') e.status = false; // skip splash during development
      out.push(e);
    } else console.error('WARN missing stock entry: ' + name);
    continue;
  }
  const file = path.join(PLUGDIR, name + '.js');
  if (!fs.existsSync(file)) { console.error('WARN plugin file not found: ' + name); continue; }
  const { desc, params } = parseHeader(fs.readFileSync(file, 'utf8'));
  out.push({ name, status: true, description: desc, parameters: params });
  console.error(`${name.padEnd(24)} params=${Object.keys(params).length}`);
}

// ---- serialize in MV's format (one entry per line) ----
const serialized =
  '// Generated by RPG Maker.\n' +
  '// Do not edit this file directly.\n' +
  'var $plugins =\n[\n' +
  out.map(e => JSON.stringify(e)).join(',\n') +
  '\n];\n';
fs.writeFileSync(PLUGINSJS, serialized);
console.error('\nWROTE ' + PLUGINSJS + '  (' + out.length + ' plugins)');
