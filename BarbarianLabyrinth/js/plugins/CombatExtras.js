//=============================================================================
// CombatExtras.js
//=============================================================================
/*:
 * @plugindesc v1.0 Перезарядка навыков (<Cooldown: N>) для игрока и врагов +
 * превью урона в бою (в подсказке навыка показывает ≈ урон по врагу).
 * @author Claude Code
 *
 * @help Навык с заметкой <Cooldown: N> нельзя использовать N ходов после
 * применения (и игроком, и врагом). Кулдаун сбрасывается в начале боя.
 */
(function() {

  //----- skill cooldowns (per-battler, reset each battle) -----
  function cooldownOf(skill) {
    if (!skill || !skill.note) return 0;
    var m = skill.note.match(/<Cooldown:\s*(\d+)>/i);
    return m ? Number(m[1]) : 0;
  }

  var _onBattleStart = Game_Battler.prototype.onBattleStart;
  Game_Battler.prototype.onBattleStart = function() {
    _onBattleStart.call(this);
    this._skillCooldowns = {};
  };

  var _meets = Game_BattlerBase.prototype.meetsSkillConditions;
  Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
    if (this._skillCooldowns && this._skillCooldowns[skill.id] > 0) return false;
    return _meets.call(this, skill);
  };

  var _useItem = Game_Battler.prototype.useItem;
  Game_Battler.prototype.useItem = function(item) {
    _useItem.call(this, item);
    if (item && DataManager.isSkill(item)) {
      var n = cooldownOf(item);
      if (n > 0) {
        if (!this._skillCooldowns) this._skillCooldowns = {};
        this._skillCooldowns[item.id] = n + 1;   // +1 to offset the turn-end tick of this turn
      }
    }
  };

  var _onTurnEnd = Game_Battler.prototype.onTurnEnd;
  Game_Battler.prototype.onTurnEnd = function() {
    _onTurnEnd.call(this);
    if (this._skillCooldowns) {
      for (var k in this._skillCooldowns) if (this._skillCooldowns[k] > 0) this._skillCooldowns[k]--;
    }
  };

  //----- battle damage preview in the skill help -----
  var _updateHelp = Window_SkillList.prototype.updateHelp;
  Window_SkillList.prototype.updateHelp = function() {
    _updateHelp.call(this);
    if (!$gameParty.inBattle() || !this._helpWindow) return;
    var skill = this.item(), actor = this._actor;
    if (!skill || !actor || !skill.damage || skill.damage.type === 0) return;
    var targets = (skill.damage.type === 3 || skill.damage.type === 4)
      ? $gameParty.aliveMembers() : $gameTroop.aliveMembers();
    if (!targets || targets.length === 0) return;
    var action = new Game_Action(actor);
    action.setSkill(skill.id);
    var t = targets[0], dmg = 0;
    try { dmg = Math.abs(action.makeDamageValue(t, false)); } catch (e) { return; }
    var verb = (skill.damage.type === 3 || skill.damage.type === 4) ? 'лечит' : 'урон';
    this._helpWindow.setText((skill.description || '') + '\n≈ ' + dmg + ' ' + verb + ' (' + t.name() + ')');
  };

  //----- predicted-damage preview on the enemy HP gauge (works for Attack too) -----
  function predictDamage(action, target) {
    if (!action || !action.item || !action.item()) return 0;
    var it = action.item();
    if (!it.damage || it.damage.type !== 1) return 0;   // только урон по HP
    try { return Math.max(0, Math.floor(action.evalDamageFormula(target))); } catch (e) { return 0; }
  }
  // while selecting an enemy, stamp each enemy's expected damage
  var _enemyUpdate = Window_BattleEnemy.prototype.update;
  Window_BattleEnemy.prototype.update = function() {
    _enemyUpdate.call(this);
    if (!this.active) return;
    var action = BattleManager.inputtingAction();
    var sel = this.enemy();
    var all = action && action.isForAll && action.isForAll();
    $gameTroop.aliveMembers().forEach(function(e) {
      var dmg = (all || e === sel) ? predictDamage(action, e) : 0;
      if (e._previewDmg !== dmg) { e._previewDmg = dmg; e._previewDirty = true; }
    });
  };
  var _enemyDeact = Window_BattleEnemy.prototype.deactivate;
  Window_BattleEnemy.prototype.deactivate = function() {
    _enemyDeact.call(this);
    $gameTroop.members().forEach(function(e) { if (e._previewDmg) { e._previewDmg = 0; e._previewDirty = true; } });
  };
  if (typeof Window_VisualHPGauge !== 'undefined') {
    var _vhgUpdate = Window_VisualHPGauge.prototype.update;
    Window_VisualHPGauge.prototype.update = function() {
      _vhgUpdate.call(this);
      if (this._battler && this._battler._previewDirty) { this._battler._previewDirty = false; this.refresh(); }
    };
    var _vhgDraw = Window_VisualHPGauge.prototype.drawActorHp;
    Window_VisualHPGauge.prototype.drawActorHp = function(actor, x, y, width) {
      _vhgDraw.call(this, actor, x, y, width);
      var dmg = actor._previewDmg || 0;
      if (dmg <= 0) return;
      width = width || 186;
      var gh = this.gaugeHeight(), gy = y + this.lineHeight() - gh - 2;
      var cur = this._displayedValue, mhp = actor.mhp;
      var x1 = Math.floor(width * (Math.max(0, cur - dmg) / mhp));
      var x2 = Math.floor(width * (cur / mhp));
      if (x2 > x1) this.contents.fillRect(x + x1, gy, x2 - x1, gh, this.textColor(18));   // снимаемый отрезок (красный)
    };
  }

})();
