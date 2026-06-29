//=============================================================================
// LabyrinthCycle.js
//=============================================================================
/*:
 * @plugindesc v1.0 Лабиринт открывается раз в N реальных минут (= новый «месяц»,
 * 30 игровых дней). Кулдаун стартует при выходе/смерти.
 * @author Claude Code
 *
 * @param Cooldown Minutes
 * @desc Через сколько РЕАЛЬНЫХ минут лабиринт снова откроется. (ТЗ: 30; для теста поставь 1.)
 * @type number
 * @min 0
 * @default 2
 *
 * @help
 * window.labCheck()        -> 0 если открыт (и сбрасывает истёкший кулдаун:
 *                             день=0, боссы 10/11/12 сброшены), иначе минуты до
 *                             открытия. Ворота города вызывают его и пишут в Var 93.
 * window.labStartCooldown() -> запустить кулдаун (Var 94 = текущее время).
 */
(function() {
  var params = PluginManager.parameters('LabyrinthCycle');
  var COOLDOWN = Number(params['Cooldown Minutes'] || 30);
  var TS = 80; // variable holding the close timestamp (ms) — 80 is free (94 = race name!)

  window.labCheck = function() {
    var t = $gameVariables.value(TS);
    if (!t) return 0;
    var mins = (Date.now() - t) / 60000;
    if (mins >= COOLDOWN) {
      $gameVariables.setValue(TS, 0);                 // cooldown over: labyrinth open
      return 0;                                       // day count & boss progress persist
    }
    return Math.ceil(COOLDOWN - mins);
  };

  window.labStartCooldown = function() {
    $gameVariables.setValue(TS, Date.now());
  };
})();
