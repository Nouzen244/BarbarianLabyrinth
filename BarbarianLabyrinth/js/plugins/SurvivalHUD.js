//=============================================================================
// SurvivalHUD.js
//=============================================================================
/*:
 * @plugindesc v1.0 HUD выживания: полоски Голод (Var10), Усталость (Var11),
 * Рассудок (Var12). Показывается в лабиринте (Switch 3).
 * @author Claude Code
 */
(function() {
  function Window_Survival() { this.initialize.apply(this, arguments); }
  Window_Survival.prototype = Object.create(Window_Base.prototype);
  Window_Survival.prototype.constructor = Window_Survival;

  Window_Survival.prototype.initialize = function() {
    var w = 220, h = this.fittingHeight(3);
    Window_Base.prototype.initialize.call(this, Graphics.boxWidth - w, 0, w, h);
    this.opacity = 160;
    this._cache = [-1, -1, -1];
    this.refresh();
  };
  Window_Survival.prototype.standardPadding = function() { return 10; };
  Window_Survival.prototype.update = function() {
    Window_Base.prototype.update.call(this);
    var show = $gameSwitches.value(3);
    this.visible = show;
    if (!show) return;
    var v = $gameVariables;
    var cur = [v.value(10), v.value(11), v.value(12)];
    if (cur[0] !== this._cache[0] || cur[1] !== this._cache[1] || cur[2] !== this._cache[2]) {
      this._cache = cur; this.refresh();
    }
  };
  Window_Survival.prototype.refresh = function() {
    this.contents.clear();
    var v = $gameVariables;
    this.drawBar(0, 'Голод',    v.value(10), '#e08000', '#ffb040');
    this.drawBar(1, 'Усталость', v.value(11), '#5060a0', '#8090d0');
    this.drawBar(2, 'Рассудок', v.value(12), '#9030c0', '#c060f0');
  };
  Window_Survival.prototype.drawBar = function(row, label, val, c1, c2) {
    var y = row * this.lineHeight();
    var lw = 78, gx = lw + 6, gw = this.contentsWidth() - gx;
    this.changeTextColor(this.normalColor());
    this.contents.fontSize = 18;
    this.drawText(label, 0, y, lw);
    this.drawGauge(gx, y, gw, (val || 0) / 100, c1, c2);
    this.drawText(String(val || 0), gx, y, gw, 'right');
  };

  var _create = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function() {
    _create.call(this);
    this._survivalWindow = new Window_Survival();
    this.addWindow(this._survivalWindow);
  };
})();
