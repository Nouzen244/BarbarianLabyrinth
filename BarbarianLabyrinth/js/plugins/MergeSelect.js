//=============================================================================
// MergeSelect.js
//=============================================================================
/*:
 * @plugindesc v1.0 Окно слияния: игрок сам выбирает 3 эссенции/оружия/брони
 * одной редкости. Открывается: $gameTemp._mergeMode='essence'|'weapon'|'armor';
 * SceneManager.push(Scene_Merge);
 * @author Claude Code
 *
 * @help Требует Rarity.js (window.RARITY). Эссенции: 3 одной редкости → 1 случайная
 * следующей. Оружие/броня: первый выбранный улучшается на +1 ранг, 2 других тратятся.
 */
(function() {
  var rarOf = function(it) { return (it && it.rarity) || 0; };
  function essByRarity(r) { return $dataItems.filter(function(it) { return it && it.essence && rarOf(it) === r; }); }
  function rname(r) { return (window.RARITY && window.RARITY[r]) ? window.RARITY[r].name : ('ранг ' + r); }

  function doEssenceMerge(units) {
    var r = rarOf(units[0]);
    units.forEach(function(it) { $gameParty.loseItem(it, 1); });
    var pool = essByRarity(r + 1);
    if (pool.length === 0) return 'Нет эссенций выше рангом.';
    var got = pool[Math.floor(Math.random() * pool.length)];
    $gameParty.gainItem(got, 1);
    return 'Получена: ' + got.name + '!';
  }
  function doGearMerge(target, fodder) {
    var r = rarOf(target);
    fodder.forEach(function(it) { $gameParty.loseItem(it, 1); });
    var ratio = window.RARITY[r + 1].mult / window.RARITY[r].mult;
    for (var i = 0; i < target.params.length; i++) if (target.params[i]) target.params[i] = Math.round(target.params[i] * ratio);
    target.rarity = r + 1; target.textColor = window.RARITY[r + 1].color; target.namePrefix = window.RARITY[r + 1].name + ' ';
    if (window.ItemManager) ItemManager.updateItemName(target);
    return 'Возвышено: ' + target.name + '!';
  }

  //----- header / help -----
  function Window_MergeHelp() { this.initialize.apply(this, arguments); }
  Window_MergeHelp.prototype = Object.create(Window_Base.prototype);
  Window_MergeHelp.prototype.constructor = Window_MergeHelp;
  Window_MergeHelp.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, this.fittingHeight(3));
  };
  Window_MergeHelp.prototype.set = function(list) {
    this.contents.clear();
    var title = { essence: 'Слияние эссенций', weapon: 'Возвышение оружия', armor: 'Возвышение брони' }[list._mode];
    this.changeTextColor(this.systemColor());
    this.drawText(title + ': выбери 3 одной редкости (Enter). Esc — сброс/выход.', 8, 0, this.contentsWidth() - 16);
    this.resetTextColor();
    var n = list._sel.length, rr = list.selRarity();
    var msg = 'Выбрано: ' + n + '/3' + (rr >= 0 ? '  (' + rname(rr) + ')' : '');
    if (list._mode !== 'essence' && n >= 1) msg += '  — улучшить: ' + list._sel[0].name;
    this.drawText(msg, 8, this.lineHeight(), this.contentsWidth() - 16);
    if (list._lastMsg) { this.changeTextColor(this.powerUpColor()); this.drawText(list._lastMsg, 8, this.lineHeight() * 2, this.contentsWidth() - 16); this.resetTextColor(); }
  };

  //----- list -----
  function Window_MergeList() { this.initialize.apply(this, arguments); }
  Window_MergeList.prototype = Object.create(Window_Selectable.prototype);
  Window_MergeList.prototype.constructor = Window_MergeList;
  Window_MergeList.prototype.initialize = function(mode, y) {
    Window_Selectable.prototype.initialize.call(this, 0, y, Graphics.boxWidth, Graphics.boxHeight - y);
    this._mode = mode; this._sel = []; this._lastMsg = '';
    this.makeData(); this.refresh(); this.select(0); this.activate();
  };
  Window_MergeList.prototype.makeData = function() {
    var m = this._mode, d = [];
    if (m === 'essence') $gameParty.items().forEach(function(it) { if (it && it.essence && rarOf(it) < 5) d.push(it); });
    else (m === 'weapon' ? $gameParty.weapons() : $gameParty.armors()).forEach(function(it) { if (it && rarOf(it) < 5) d.push(it); });
    this._data = d;
  };
  Window_MergeList.prototype.maxItems = function() { return this._data ? this._data.length : 0; };
  Window_MergeList.prototype.item = function() { return this._data[this.index()]; };
  Window_MergeList.prototype.selUnits = function(it) { var n = 0; for (var i = 0; i < this._sel.length; i++) if (this._sel[i] === it) n++; return n; };
  Window_MergeList.prototype.selRarity = function() { return this._sel.length ? rarOf(this._sel[0]) : -1; };
  Window_MergeList.prototype.drawItem = function(index) {
    var it = this._data[index]; if (!it) return; var r = this.itemRect(index);
    var u = this.selUnits(it);
    this.drawIcon(it.iconIndex, r.x + 2, r.y + 2);
    if (it.textColor != null) this.changeTextColor(this.textColor(it.textColor)); else this.resetTextColor();
    var cnt = (this._mode === 'essence') ? (' ×' + $gameParty.numItems(it)) : '';
    var mark = u > 0 ? ('【' + u + '】 ') : '';
    this.drawText(mark + it.name + cnt, r.x + 40, r.y, r.width - 48);
    this.resetTextColor();
  };
  Window_MergeList.prototype.addUnit = function() {
    var it = this.item();
    if (!it) { SoundManager.playBuzzer(); return; }
    if (this._sel.length > 0 && rarOf(it) !== this.selRarity()) { SoundManager.playBuzzer(); this._lastMsg = 'Только одна редкость за раз.'; this.refresh(); this.callHandler('selChange'); return; }
    if (this._sel.length >= 3) { SoundManager.playBuzzer(); return; }
    var maxUnits = (this._mode === 'essence') ? $gameParty.numItems(it) : 1;
    if (this.selUnits(it) >= maxUnits) { SoundManager.playBuzzer(); return; }
    this._sel.push(it); this._lastMsg = ''; SoundManager.playCursor(); this.refresh(); this.callHandler('selChange');
  };
  Window_MergeList.prototype.clearSel = function() { this._sel = []; this.refresh(); this.callHandler('selChange'); };

  //----- scene -----
  function Scene_Merge() { this.initialize.apply(this, arguments); }
  Scene_Merge.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_Merge.prototype.constructor = Scene_Merge;
  Scene_Merge.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    var mode = $gameTemp._mergeMode || 'essence';
    this._help = new Window_MergeHelp(); this.addWindow(this._help);
    this._list = new Window_MergeList(mode, this._help.height); this.addWindow(this._list);
    this._list.setHandler('ok', this.onOk.bind(this));
    this._list.setHandler('cancel', this.onCancel.bind(this));
    this._list.setHandler('selChange', this.onSelChange.bind(this));
    this._help.set(this._list);
  };
  Scene_Merge.prototype.onSelChange = function() { this._help.set(this._list); };
  Scene_Merge.prototype.onOk = function() {
    this._list.addUnit();
    if (this._list._sel.length === 3) {
      var mode = this._list._mode, sel = this._list._sel.slice();
      var msg = (mode === 'essence') ? doEssenceMerge(sel) : doGearMerge(sel[0], [sel[1], sel[2]]);
      $gameVariables.setValue(88, msg);
      this._list._sel = []; this._list._lastMsg = msg;
      this._list.makeData();
      if (this._list.index() >= this._list.maxItems()) this._list.select(Math.max(0, this._list.maxItems() - 1));
      this._list.refresh(); this._help.set(this._list);
    }
    this._list.activate();
  };
  Scene_Merge.prototype.onCancel = function() {
    if (this._list._sel.length > 0) { this._list.clearSel(); this._help.set(this._list); this._list.activate(); }
    else { $gameTemp._mergeMode = null; this.popScene(); }
  };

  window.Scene_Merge = Scene_Merge;
})();
