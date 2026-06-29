//=============================================================================
// Transmute.js  (Phase C — quality upgrade by merging)
//=============================================================================
/*:
 * @plugindesc v1.0 Возвышение редкости: слить 3 эссенции одной редкости → 1
 * случайная следующей; снаряжение +1 редкость, пожертвовав 2 такой же.
 * Легендарное возвысить нельзя. Сообщения в Var88/Var89.
 * @author Claude Code
 *
 * @help
 * Требует Rarity.js (window.RARITY) и YEP_ItemCore (независимое снаряжение).
 *   window.transmuteGearPreview('weapon'|'armor');
 *   window.transmuteGear('weapon'|'armor');
 *   window.transmuteEssence(rarityIndex 1..4);  // 1 зелёная … 4 красная
 */
(function() {
  var rarOf = function(it) { return (it && it.rarity) || 0; };

  // -------- gear (independent weapons/armor) --------
  function fodder(kind, rank, exclude) {
    var list = (kind === 'weapon') ? $gameParty.weapons() : $gameParty.armors();
    return list.filter(function(it) { return it !== exclude && rarOf(it) === rank; });
  }
  function equippedItem(kind) {
    var a = $gameActors.actor(1); if (!a) return null;
    return (kind === 'weapon') ? (a.weapons()[0] || null) : (a.armors()[0] || null);
  }
  window.transmuteGearPreview = function(kind) {
    var it = equippedItem(kind);
    if (!it) { $gameVariables.setValue(88, kind === 'weapon' ? 'Надень оружие.' : 'Надень броню.'); $gameVariables.setValue(89, ''); return; }
    var r = rarOf(it);
    if (r >= 5) { $gameVariables.setValue(88, it.name); $gameVariables.setValue(89, 'Легендарное — выше некуда.'); return; }
    var f = fodder(kind, r, it).length;
    $gameVariables.setValue(88, it.name);
    $gameVariables.setValue(89, window.RARITY[r].name + ' → ' + window.RARITY[r + 1].name +
      '. Нужно 2 такой же редкости (есть ' + f + ').');
  };
  window.transmuteGear = function(kind) {
    var it = equippedItem(kind);
    if (!it) { $gameVariables.setValue(88, 'Нет надетого предмета.'); return; }
    var r = rarOf(it);
    if (r >= 5) { $gameVariables.setValue(88, 'Уже легендарное.'); return; }
    var f = fodder(kind, r, it);
    if (f.length < 2) { $gameVariables.setValue(88, 'Нужно ещё 2 предмета редкости «' + window.RARITY[r].name + '».'); return; }
    $gameParty.loseItem(f[0], 1); $gameParty.loseItem(f[1], 1);
    var ratio = window.RARITY[r + 1].mult / window.RARITY[r].mult;
    for (var i = 0; i < it.params.length; i++) if (it.params[i]) it.params[i] = Math.round(it.params[i] * ratio);
    it.rarity = r + 1; it.textColor = window.RARITY[r + 1].color; it.namePrefix = window.RARITY[r + 1].name + ' ';
    ItemManager.updateItemName(it);
    $gameVariables.setValue(88, 'Возвышено: ' + it.name + '!');
  };

  // -------- essences (stackable, rarity fixed by item) --------
  function essByRarity(r) { return $dataItems.filter(function(it) { return it && it.essence && rarOf(it) === r; }); }
  function ownedCount(r) { var t = 0; $gameParty.items().forEach(function(it) { if (it && it.essence && rarOf(it) === r) t += $gameParty.numItems(it); }); return t; }
  window.transmuteEssence = function(r) {
    if (r >= 5) { $gameVariables.setValue(88, 'Легендарные эссенции не возвысить.'); return; }
    var total = ownedCount(r);
    if (total < 3) { $gameVariables.setValue(88, 'Нужно 3 эссенции этой редкости (есть ' + total + ').'); return; }
    var owned = $gameParty.items().filter(function(it) { return it && it.essence && rarOf(it) === r; });
    var need = 3;
    for (var i = 0; i < owned.length && need > 0; i++) {
      var n = Math.min(need, $gameParty.numItems(owned[i]));
      $gameParty.loseItem(owned[i], n); need -= n;
    }
    var pool = essByRarity(r + 1);
    if (pool.length === 0) { $gameVariables.setValue(88, 'Нет эссенций выше рангом.'); return; }
    var got = pool[Math.floor(Math.random() * pool.length)];
    $gameParty.gainItem(got, 1);
    $gameVariables.setValue(88, 'Получена: ' + got.name + '!');
  };

  // chest drop: random essence with rarity CAPPED by the current floor (not always max)
  window.dropChestEssence = function() {
    var cap = window.rarityCap ? window.rarityCap() : 2;
    var r = window.rollRarity(cap);
    if (r < 1) r = 1;                          // essences are rarity 1..5 (no white)
    var pool = essByRarity(r);
    while (pool.length === 0 && r > 1) { r--; pool = essByRarity(r); }
    if (pool.length === 0) { $gameVariables.setValue(88, '(пусто)'); return; }
    var it = pool[Math.floor(Math.random() * pool.length)];
    $gameParty.gainItem(it, 1);
    var rname = (window.RARITY && window.RARITY[it.rarity || 0]) ? window.RARITY[it.rarity || 0].name : '';
    $gameVariables.setValue(88, '[' + rname + '] ' + it.name);
  };

  // chest drop: random weapon/armor as an independent item (rarity rolled by the Rarity plugin, capped by floor)
  window.dropChestGear = function() {
    var asWeapon = Math.random() < 0.5;
    var list = asWeapon ? $dataWeapons : $dataArmors;
    var bases = [];
    for (var i = 1; i < list.length; i++) { var b = list[i]; if (b && b.name && !b.baseItemId) bases.push(b); }
    if (bases.length === 0) { $gameVariables.setValue(88, '(пусто)'); return; }
    var base = bases[Math.floor(Math.random() * bases.length)];
    $gameParty.gainItem(base, 1);                 // YEP делает независимую копию; Rarity вешает редкость
    var made = list[list.length - 1] || base;     // новая копия добавляется в конец списка
    var rname = (window.RARITY && made.rarity != null && window.RARITY[made.rarity]) ? ('[' + window.RARITY[made.rarity].name + '] ') : '';
    $gameVariables.setValue(88, rname + made.name);
  };
})();
