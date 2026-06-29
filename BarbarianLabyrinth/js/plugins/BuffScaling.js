//=============================================================================
// BuffScaling.js
//=============================================================================
/*:
 * @plugindesc v1.0 Сила баффов/дебаффов растёт с уровнем прокачки навыка в древе.
 * Базовый эффект задан в состоянии; плагин добавляет прирост за каждый уровень.
 * @author Claude Code
 *
 * @help Когда персонаж применяет навык, дающий бафф/дебафф-состояние, на цели
 * запоминается уровень прокачки этого навыка (actor._skillLv). Параметры состояния
 * усиливаются на (per × уровень) сверх базового значения из самого состояния.
 * У врагов уровня прокачки нет → действует только базовый эффект (безопасный
 * откат, если плагин отключить).
 */
(function() {

  // прирост param-rate за уровень прокачки (база — в трейтах состояния)
  var INCR_PARAM = { 124: { param: 2, per: 0.10 },   // Ярость: ATK +10%/ур.
                     129: { param: 2, per: -0.05 } }; // Ослабление: ATK −5%/ур.
  // прирост xparam (HRG = регенерация/яд) за уровень, аддитивно
  var INCR_X = { 125: { x: 7, per: 0.02 },    // Регенерация: +2%/ур.
                 127: { x: 7, per: -0.02 },   // Отравление: −2%/ур.
                 128: { x: 7, per: -0.03 } }; // Поджог: −3%/ур.

  // запомнить уровень прокачки навыка на цели при наложении состояния
  var _addNormal = Game_Action.prototype.itemEffectAddStateNormal;
  Game_Action.prototype.itemEffectAddStateNormal = function(target, effect) {
    _addNormal.call(this, target, effect);
    var sid = effect.dataId;
    if ((INCR_PARAM[sid] || INCR_X[sid]) && target.isStateAffected(sid)) {
      var subj = this.subject(), item = this.item(), lv = 0;
      if (subj && subj._skillLv && item) lv = subj._skillLv[item.id] || 0;
      if (!target._buffLv) target._buffLv = {};
      target._buffLv[sid] = lv;
    }
  };

  var _paramRate = Game_BattlerBase.prototype.paramRate;
  Game_BattlerBase.prototype.paramRate = function(paramId) {
    var r = _paramRate.call(this, paramId);
    if (this._buffLv) {
      var st = this.states();
      for (var i = 0; i < st.length; i++) {
        var c = INCR_PARAM[st[i].id];
        if (c && c.param === paramId) { var lv = this._buffLv[st[i].id] || 0; if (lv > 0) r *= (1 + c.per * lv); }
      }
    }
    return r;
  };

  var _xparam = Game_BattlerBase.prototype.xparam;
  Game_BattlerBase.prototype.xparam = function(xparamId) {
    var v = _xparam.call(this, xparamId);
    if (this._buffLv) {
      var st = this.states();
      for (var i = 0; i < st.length; i++) {
        var c = INCR_X[st[i].id];
        if (c && c.x === xparamId) { var lv = this._buffLv[st[i].id] || 0; if (lv > 0) v += c.per * lv; }
      }
    }
    return v;
  };

})();
