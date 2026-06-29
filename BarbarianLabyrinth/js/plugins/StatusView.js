//=============================================================================
// StatusView.js
//=============================================================================
/*:
 * @plugindesc v1.0 Кнопка «Статусы» в бою: окно с эффектами всех союзников и
 * врагов (HP, щит, временные баффы/дебаффы). Не тратит ход.
 * @author Claude Code
 *
 * @help Команда «Статусы» появляется в меню действий персонажа. Открывает обзор;
 * Enter/Esc — закрыть и вернуться к выбору действия.
 */
(function() {

  //----- add «Статусы» command to the actor command window -----
  var _makeList = Window_ActorCommand.prototype.makeCommandList;
  Window_ActorCommand.prototype.makeCommandList = function() {
    _makeList.call(this);
    if (this._actor) this.addCommand('Статусы', 'statuses', true);
  };

  //----- overview window -----
  function Window_StatusView() { this.initialize.apply(this, arguments); }
  Window_StatusView.prototype = Object.create(Window_Selectable.prototype);
  Window_StatusView.prototype.constructor = Window_StatusView;

  Window_StatusView.prototype.initialize = function() {
    var w = Graphics.boxWidth - 80, h = Graphics.boxHeight - 140;
    Window_Selectable.prototype.initialize.call(this, 40, 70, w, h);
    this.openness = 0;
    this.deactivate();
  };
  Window_StatusView.prototype.battlers = function() {
    return $gameParty.battleMembers().concat($gameTroop.aliveMembers());
  };
  Window_StatusView.prototype.maxItems = function() { return this.battlers().length; };
  Window_StatusView.prototype.itemHeight = function() { return this.lineHeight() * 2 + 6; };
  Window_StatusView.prototype.tempStates = function(b) {
    return b.states().filter(function(s) { return s && s.autoRemovalTiming > 0 && s.iconIndex >= 0; });
  };
  Window_StatusView.prototype.drawItem = function(index) {
    var b = this.battlers()[index]; if (!b) return;
    var r = this.itemRect(index), iw = Window_Base._iconWidth;
    this.changeTextColor(this.textColor(b.isActor() ? 4 : 2));   // союзники голубой, враги красный
    this.drawText(b.name(), r.x + 4, r.y, 260);
    this.resetTextColor();
    this.drawText('HP ' + b.hp + '/' + b.mhp, r.x + 270, r.y, 200);
    if (b.barrierPoints && b.barrierPoints() > 0) {
      this.changeTextColor(this.textColor(3));
      this.drawText('Щит ' + b.barrierPoints(), r.x + 470, r.y, 160);
      this.resetTextColor();
    }
    var states = this.tempStates(b), x = r.x + 8, y = r.y + this.lineHeight() + 2;
    if (states.length === 0) {
      this.changeTextColor(this.textColor(7));
      this.drawText('нет эффектов', x, y, r.width - 16);
      this.resetTextColor();
    } else {
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        if (x + iw + 120 > r.x + r.width) break;   // не вылезать за окно
        this.drawIcon(s.iconIndex, x, y); x += iw + 2;
        this.drawText(s.name, x, y, 116); x += 122;
      }
    }
  };
  Window_StatusView.prototype.refresh = function() {
    this.createContents();
    this.contents.clear();
    for (var i = 0; i < this.maxItems(); i++) this.drawItem(i);
  };

  //----- Scene_Battle integration -----
  var _createAll = Scene_Battle.prototype.createAllWindows;
  Scene_Battle.prototype.createAllWindows = function() {
    _createAll.call(this);
    this._statusViewWindow = new Window_StatusView();
    this._statusViewWindow.setHandler('cancel', this.closeStatusView.bind(this));
    this._statusViewWindow.setHandler('ok', this.closeStatusView.bind(this));
    this.addWindow(this._statusViewWindow);   // last -> on top
  };
  var _createActorCmd = Scene_Battle.prototype.createActorCommandWindow;
  Scene_Battle.prototype.createActorCommandWindow = function() {
    _createActorCmd.call(this);
    this._actorCommandWindow.setHandler('statuses', this.commandStatuses.bind(this));
  };
  Scene_Battle.prototype.commandStatuses = function() {
    this._statusViewWindow.refresh();
    this._statusViewWindow.open();
    this._statusViewWindow.activate();
    this._statusViewWindow.select(0);
    this._actorCommandWindow.deactivate();
  };
  Scene_Battle.prototype.closeStatusView = function() {
    this._statusViewWindow.close();
    this._statusViewWindow.deactivate();
    this._actorCommandWindow.activate();
  };

  //----- small row of buff/debuff icons above each enemy (near its HP) -----
  function Sprite_EnemyStates() { this.initialize.apply(this, arguments); }
  Sprite_EnemyStates.prototype = Object.create(Sprite.prototype);
  Sprite_EnemyStates.prototype.constructor = Sprite_EnemyStates;
  Sprite_EnemyStates.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._iconSet = ImageManager.loadSystem('IconSet');
    this._key = null;
    this.bitmap = new Bitmap(8 * 22, 22);
    this.anchor.x = 0.5; this.anchor.y = 1;
  };
  Sprite_EnemyStates.prototype.setup = function(b) { this._battler = b; };
  Sprite_EnemyStates.prototype.tempStates = function() {
    if (!this._battler) return [];
    return this._battler.states().filter(function(s) { return s && s.autoRemovalTiming > 0 && s.iconIndex > 0; });
  };
  Sprite_EnemyStates.prototype.update = function() {
    Sprite.prototype.update.call(this);
    var st = this.tempStates();
    var key = st.map(function(s) { return s.iconIndex; }).join(',');
    if (key !== this._key) { this._key = key; this.redraw(st); }
    this.visible = st.length > 0 && !!this._battler && this._battler.isAlive();
    if (this.parent && this.parent.bitmap && this.parent.bitmap.height) {
      this.y = -this.parent.bitmap.height - 4;
    }
  };
  Sprite_EnemyStates.prototype.redraw = function(st) {
    this.bitmap.clear();
    var sz = 20, pw = Window_Base._iconWidth, ph = Window_Base._iconHeight, cols = 16;
    for (var i = 0; i < st.length && i < 8; i++) {
      var ic = st[i].iconIndex;
      this.bitmap.blt(this._iconSet, (ic % cols) * pw, Math.floor(ic / cols) * ph, pw, ph, i * (sz + 2), 0, sz, sz);
    }
  };
  var _setBattler = Sprite_Enemy.prototype.setBattler;
  Sprite_Enemy.prototype.setBattler = function(battler) {
    _setBattler.call(this, battler);
    if (!this._tempStateIcons) { this._tempStateIcons = new Sprite_EnemyStates(); this.addChild(this._tempStateIcons); }
    this._tempStateIcons.setup(battler);
  };

})();
