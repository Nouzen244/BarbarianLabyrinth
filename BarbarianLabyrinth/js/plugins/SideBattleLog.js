//=============================================================================
// SideBattleLog.js
//=============================================================================
/*:
 * @plugindesc v1.0 Постоянный лог боя в окне справа: кто атаковал, промах,
 * «не пробил броню» (0 урона), дебаффы/баффы, лечение.
 * @author Claude Code
 *
 * @help Зеркалит сообщения штатного боевого лога в прокручивающееся окно справа.
 */
(function() {

  function Window_SideLog() { this.initialize.apply(this, arguments); }
  Window_SideLog.prototype = Object.create(Window_Base.prototype);
  Window_SideLog.prototype.constructor = Window_SideLog;

  Window_SideLog.prototype.initialize = function() {
    var w = 300, h = Graphics.boxHeight - 180;
    Window_Base.prototype.initialize.call(this, Graphics.boxWidth - w, 8, w, h);
    this._lines = [];
    this.opacity = 160;            // полупрозрачное, чтобы видеть врагов
    this.contentsOpacity = 255;
    this.refresh();
  };
  Window_SideLog.prototype.standardFontSize = function() { return 18; };
  Window_SideLog.prototype.lineHeight = function() { return 24; };
  Window_SideLog.prototype.visibleLines = function() {
    return Math.floor(this.contentsHeight() / this.lineHeight());
  };
  Window_SideLog.prototype.push = function(text) {
    if (!text) return;
    // длинные строки переносим грубо по ширине
    this._lines.push(String(text));
    var max = this.visibleLines();
    while (this._lines.length > max) this._lines.shift();
    this.refresh();
  };
  Window_SideLog.prototype.clearLog = function() { this._lines = []; this.refresh(); };
  Window_SideLog.prototype.refresh = function() {
    this.contents.clear();
    this.changeTextColor(this.systemColor());
    for (var i = 0; i < this._lines.length; i++) {
      this.resetTextColor();
      this.drawTextEx(this._lines[i], 4, i * this.lineHeight());
    }
  };

  // зеркалим каждую строку штатного боевого лога
  var _addText = Window_BattleLog.prototype.addText;
  Window_BattleLog.prototype.addText = function(text) {
    _addText.call(this, text);
    var s = SceneManager._scene;
    if (s && s._sideLog) s._sideLog.push(text);
  };

  // создаём окно справа
  var _createAll = Scene_Battle.prototype.createAllWindows;
  Scene_Battle.prototype.createAllWindows = function() {
    _createAll.call(this);
    this._sideLog = new Window_SideLog();
    this.addWindow(this._sideLog);
  };

})();
