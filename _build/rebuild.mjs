// Master rebuild — runs all data generators in dependency order.
// Use this after editing any generator so dependent phases stay consistent.
// (Does NOT touch plugins.js — run gen_plugins.mjs separately for that.)
console.error('=== REBUILD: data generators in order ===');
for (const m of ['gen_system', 'gen_phase2', 'gen_phase3', 'gen_phase4', 'gen_phase5', 'gen_phase6', 'gen_phase7', 'gen_city', 'gen_interiors', 'gen_phase9', 'gen_phase10', 'gen_phase8', 'gen_phase11', 'gen_extras', 'gen_npcs', 'gen_survival', 'gen_town']) {
  console.error(`\n--- ${m} ---`);
  await import(`./${m}.mjs`);
}
console.error('\n=== REBUILD complete ===');
