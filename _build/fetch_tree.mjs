import { getJSON } from './net.mjs';

const API = 'https://api.github.com/repos/Ippang/Yanfly-Engine-Plugins-MV/git/trees/master?recursive=1';
const tree = await getJSON(API);
const names = tree.tree
  .filter(n => /^YEP\/YEP_.*\.js$/.test(n.path))
  .map(n => n.path.replace(/^YEP\//, '').replace(/\.js$/, ''))
  .sort();
console.log('TOTAL YEP_: ' + names.length);
const want = /Core|Battle|Item|Shop|Status|Skill|Class|Message|MiniLabel|Save|Quest|Target|Selection|Element|Equip|Job|Subclass|Buff/;
console.log('--- relevant ---');
for (const n of names.filter(n => want.test(n))) console.log(n);
