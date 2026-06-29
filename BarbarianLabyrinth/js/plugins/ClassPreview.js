//=============================================================================
// ClassPreview.js
//=============================================================================
/*:
 * @plugindesc v1.1 Живой предпросмотр облика актёра 1 + окно с подробным описанием
 * класса при наведении курсора на пункт в Show Choices (выбор класса).
 * @author Claude Code
 *
 * @help
 * Перед Show Choices задай в событии (Script):
 *   $gameTemp._classPreview = [['Actor1',0],['Actor1',1],['Actor1',2]];
 *   $gameTemp._classInfo    = ['описание 1', 'описание 2', ...];   // многострочный текст (\n)
 * При наведении меняется облик актёра 1 и показывается описание класса.
 * После выбора очисти оба: $gameTemp._classPreview = null; $gameTemp._classInfo = null;
 */
(function() {

  // ---- небольшое окно с описанием класса (мелкий шрифт, чтобы строки влезали) ----
  function Window_ClassInfo() { this.initialize.apply(this, arguments); }
  Window_ClassInfo.prototype = Object.create(Window_Base.prototype);
  Window_ClassInfo.prototype.constructor = Window_ClassInfo;
  Window_ClassInfo.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, 16, 12, Graphics.boxWidth - 32, this.fittingHeight(5));
  };
  Window_ClassInfo.prototype.standardFontSize = function() { return 21; };
  Window_ClassInfo.prototype.standardPadding = function() { return 14; };
  Window_ClassInfo.prototype.setText = function(text) {
    if (this._text === text) return;
    this._text = text;
    this.contents.clear();
    this.drawTextEx(text, 4, 0);
  };

  function infoWindow() {
    var scene = SceneManager._scene;
    if (!scene) return null;
    if (!scene._classInfoWindow) {
      var w = new Window_ClassInfo();
      (scene._windowLayer || scene).addChild(w);
      scene._classInfoWindow = w;
    }
    return scene._classInfoWindow;
  }
  function removeInfoWindow() {
    var scene = SceneManager._scene;
    if (scene && scene._classInfoWindow) {
      (scene._windowLayer || scene).removeChild(scene._classInfoWindow);
      scene._classInfoWindow = null;
    }
  }

  var _select = Window_ChoiceList.prototype.select;
  Window_ChoiceList.prototype.select = function(index) {
    _select.call(this, index);
    // 1) облик актёра
    var p = $gameTemp ? $gameTemp._classPreview : null;
    if (p && index >= 0 && index < p.length && p[index]) {
      var a = $gameActors.actor(1), s = p[index];
      if (a && (a.characterName() !== s[0] || a.characterIndex() !== s[1])) {
        a.setCharacterImage(s[0], s[1]);
        a.setFaceImage(s[0], s[1]);
        $gamePlayer.refresh();
      }
    }
    // 2) описание класса
    var info = $gameTemp ? $gameTemp._classInfo : null;
    if (info && index >= 0 && index < info.length && info[index]) {
      var w = infoWindow();
      if (w) { w.setText(info[index]); w.visible = true; }
    } else {
      removeInfoWindow();
    }
  };

  // убрать окно описания, когда список выбора закрывается
  var _close = Window_ChoiceList.prototype.close;
  Window_ChoiceList.prototype.close = function() {
    _close.call(this);
    removeInfoWindow();
  };

})();
