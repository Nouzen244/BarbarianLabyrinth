//=============================================================================
// Upgrade.js  (Phase B of the gear system)
//=============================================================================
/*:
 * @plugindesc v1.0 Улучшение надетого снаряжения +N. Макс. уровень зависит от
 * редкости (Белый +10 … Жёлтый +25). Шанс провала, а на +3 и выше — потери.
 * @author Claude Code
 *
 * @help
 * Сообщения пишутся в Variable 88 (показывай \V[88] после вызова):
 *   window.upgradePreview('weapon'|'armor'); — текст с ценой/шансом
 *   window.tryUpgrade('weapon'|'armor');     — попытка (списывает золото, ролл)
 * Уровень и бонусы хранятся в самом независимом предмете (item.upgradeLevel),
 * поэтому сохраняются в сейве.
 */
(function() {
  var MAXLV = [10, 12, 15, 19, 22, 25];   // by rarity 0..5

  function equipped(kind) {
    var a = $gameActors.actor(1); if (!a) return null;
    return (kind === 'weapon') ? (a.weapons()[0] || null) : (a.armors()[0] || null);
  }
  function maxLv(it) { return MAXLV[(it && it.rarity) || 0]; }
  function cost(it) { var lv = it.upgradeLevel || 0; return Math.round(120 * (lv + 1) * (1 + ((it.rarity || 0) * 0.4))); }
  function chance(it) { var lv = it.upgradeLevel || 0; return Math.max(20, 92 - lv * 6); }

  window.upgradePreview = function(kind) {
    var it = equipped(kind);
    if (!it) { $gameVariables.setValue(88, kind === 'weapon' ? 'Сначала надень оружие.' : 'Сначала надень броню.'); $gameVariables.setValue(89, ''); return; }
    var lv = it.upgradeLevel || 0, mx = maxLv(it);
    if (lv >= mx) { $gameVariables.setValue(88, it.name); $gameVariables.setValue(89, 'Уже максимум (+' + mx + ').'); return; }
    $gameVariables.setValue(88, it.name);                                   // line 1: item name
    $gameVariables.setValue(89, '+' + lv + ' → +' + (lv + 1) + '   ' +  // line 2: cost / chance
      cost(it) + 'з   успех ' + chance(it) + '%' + (lv >= 2 ? '  (риск!)' : ''));
  };

  window.tryUpgrade = function(kind) {
    var a = $gameActors.actor(1), it = equipped(kind);
    if (!it) { $gameVariables.setValue(88, 'Нет надетого предмета.'); return; }
    var lv = it.upgradeLevel || 0, mx = maxLv(it);
    if (lv >= mx) { $gameVariables.setValue(88, 'Уже максимум (+' + mx + ').'); return; }
    var c = cost(it);
    if ($gameParty.gold() < c) { $gameVariables.setValue(88, 'Не хватает золота (нужно ' + c + ').'); return; }
    $gameParty.loseGold(c);
    if (Math.random() * 100 < chance(it)) {
      it.upgradeLevel = lv + 1;
      var base = DataManager.getBaseItem(it);
      for (var i = 0; i < it.params.length; i++) {
        if (base.params[i]) it.params[i] += Math.max(1, Math.round(base.params[i] * 0.08));
      }
      it.nameSuffix = ' +' + it.upgradeLevel;
      ItemManager.updateItemName(it);
      $gameVariables.setValue(88, 'Успех! Улучшено до +' + it.upgradeLevel + '.');
    } else if (lv >= 3 && Math.random() < 0.5) {
      a.discardEquip(it);                         // destroyed (not returned to bag)
      $gameVariables.setValue(88, 'ПРОВАЛ! Предмет разрушился...');
    } else {
      $gameVariables.setValue(88, 'Провал. Золото потрачено впустую.');
    }
  };
})();
