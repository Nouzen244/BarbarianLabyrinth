//=============================================================================
// EssenceSlots.js
//=============================================================================
/*:
 * @plugindesc v1.0 Ограничивает число активных эссенций числом слотов
 * (Variable 24). Эссенции — состояния 22-31. Помощник снятия эссенций.
 * @author Claude Code
 *
 * @help
 * Эссенции = состояния с id 22..31. Активных одновременно может быть не
 * больше, чем значение Variable 24 (слоты; по умолчанию 4, у варвара 6).
 * При попытке добавить эссенцию сверх лимита — отказ с сообщением.
 *
 * Скрипт-вызовы:
 *   $gameActors.actor(1).clearEssences();   // снять все эссенции
 *   $gameActors.actor(1).essenceCount();     // сколько активно
 */
(function() {
  var ESSENCE_FIRST = 22, ESSENCE_LAST = 31, SLOT_VAR = 24;
  var isEssence = function(id) {
    if (id >= ESSENCE_FIRST && id <= ESSENCE_LAST) return true;   // original essences
    var s = $dataStates[id];                                       // new per-monster essences
    return !!(s && /<Essence>/i.test(s.note || ''));
  };

  Game_Actor.prototype.essenceCount = function() {
    return this._states.filter(isEssence).length;
  };
  Game_Actor.prototype.essenceSlots = function() {
    return $gameVariables.value(SLOT_VAR) || 4;
  };
  Game_Actor.prototype.clearEssences = function() {
    this._states.filter(isEssence).slice().forEach(function(id) { this.removeState(id); }, this);
    this.refresh();
  };

  var _addState = Game_Battler.prototype.addState;
  Game_Battler.prototype.addState = function(stateId) {
    if (this.isActor() && isEssence(stateId) && !this.isStateAffected(stateId)) {
      if (this.essenceCount() >= this.essenceSlots()) {
        $gameMessage.add('Слоты эссенций заполнены (' + this.essenceSlots() + ').');
        $gameMessage.add('Сначала освободи слот.');
        return;
      }
    }
    _addState.call(this, stateId);
  };
})();
