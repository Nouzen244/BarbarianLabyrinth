//=============================================================================
// LabyrinthScaling.js
//=============================================================================
/*:
 * @plugindesc v1.0 Враги в Лабиринте крепнут с глубиной: база параметров
 * умножается на (1 + (этаж-1) * K). Поверх этого действуют состояния
 * Усиленный/Элитный/Босс.
 * @author Claude Code
 *
 * @param Per Floor
 * @desc Прирост за этаж (0.03 = +3%/этаж; этаж 50 ≈ ×2.5).
 * @type number
 * @decimals 3
 * @default 0.030
 *
 * @help
 * Этаж = mapId - 5 (Map006 = этаж 1 ... Map055 = этаж 50). Масштабирование
 * применяется только на картах лабиринта (id 6..55), в т.ч. в бою (бой идёт
 * поверх текущей карты-этажа).
 */
(function() {
  var K = Number(PluginManager.parameters('LabyrinthScaling')['Per Floor'] || 0.03);
  function floorFactor() {
    var id = $gameMap ? $gameMap.mapId() : 0;
    if (id < 101 || id > 150) return 1;          // labyrinth floor maps are Map101..Map150
    return 1 + (id - 101) * K;                    // floor1 (id101) = x1, floor50 (id150) = 1+49K
  }
  var _paramBase = Game_Enemy.prototype.paramBase;
  Game_Enemy.prototype.paramBase = function(paramId) {
    return Math.round(_paramBase.call(this, paramId) * floorFactor());
  };
})();
