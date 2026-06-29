//=============================================================================
// Labyrinth.js
//=============================================================================
/*:
 * @plugindesc v1.0 Смерть в Лабиринте (Switch 3 ON) = возврат в город с потерей
 * половины золота вместо Game Over.
 * @author Claude Code
 *
 * @help
 * Если партия гибнет, пока Switch 3 (в лабиринте) включён, вместо экрана
 * Game Over персонаж «выносится» в Рафдонию: HP восстановлено, теряется
 * половина золота (записывается в Variable 99), включается Switch 51 —
 * по нему общее событие 13 покажет сообщение о смерти.
 */
(function() {
  var IN_LAB = 3, DIED_FLAG = 51, LOST_GOLD = 99;
  var _start = Scene_Gameover.prototype.start;
  Scene_Gameover.prototype.start = function() {
    if ($gameSwitches.value(IN_LAB)) {
      $gameSwitches.setValue(IN_LAB, false);
      var lost = Math.floor($gameParty.gold() / 2);
      $gameParty.loseGold(lost);
      $gameVariables.setValue(LOST_GOLD, lost);
      // revive + heal but KEEP essence states (22-33); only clear death/debuffs
      $gameParty.members().forEach(function(a) {
        [1, 4, 17, 18, 19, 20, 21].forEach(function(s) { a.removeState(s); });
        a.setHp(a.mhp); a.setMp(a.mmp);
      });
      $gameSwitches.setValue(DIED_FLAG, true);
      // ВАЖНО: оборвать событие боя, иначе интерпретатор $gameMap продолжит команды
      // после боя (выдаст награду босса/разлома и спрячет его) уже после воскрешения
      if ($gameMap && $gameMap._interpreter) $gameMap._interpreter.clear();
      $gameTroop.clear();
      if (window.labStartCooldown) window.labStartCooldown(); // labyrinth closes after death
      $gamePlayer.reserveTransfer(2, 20, 4, 2, 0); // back to the city gate
      SceneManager.goto(Scene_Map);
      return;
    }
    _start.call(this);
  };
})();
