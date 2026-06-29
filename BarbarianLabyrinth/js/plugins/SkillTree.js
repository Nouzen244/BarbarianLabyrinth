//=============================================================================
// SkillTree.js  (attribute tree + per-skill upgrade tree)
//=============================================================================
/*:
 * @plugindesc v2.0 Древо: очки атрибутов (1/уровень) и таланта (+2 за 2 уровня).
 * Атрибуты (+сила/хп/защ/маг/ловк/удача), пассивки, и ПРОКАЧКА реальных навыков
 * класса до +10 (больше урона / меньше маны). Команда меню «Древо».
 * @author Claude Code
 *
 * @help Открыть: меню → «Древо», либо script: SceneManager.push(Scene_SkillTree);
 * Прокачка навыка: +8% урона и −4% маны за уровень (до +10).
 */
var Imported = Imported || {}; Imported.SkillTree = true;

var SKILLTREE_PNAME = ['Макс.HP','Макс.MP','ATK','DEF','MAT','MDF','AGI','LUK'];
var SKILLTREE_DMG_PER = 0.08;   // +урон за уровень прокачки навыка
var SKILLTREE_MP_PER  = 0.04;   // −мана за уровень

// fixed attribute (pool A) + passive (pool T) nodes
var SKILLTREE_ATTR = [
  { id:'a_str', name:'Сила',     icon:76, max:99, pool:'A', param:2, per:3 },
  { id:'a_vit', name:'Жизнь',    icon:84, max:99, pool:'A', param:0, per:30 },
  { id:'a_def', name:'Защита',   icon:81, max:99, pool:'A', param:3, per:3 },
  { id:'a_mat', name:'Магия',    icon:79, max:99, pool:'A', param:4, per:3 },
  { id:'a_agi', name:'Ловкость', icon:82, max:99, pool:'A', param:6, per:2 },
  { id:'a_luk', name:'Удача',    icon:87, max:99, pool:'A', param:7, per:2 },
];
var SKILLTREE_PASSIVE = [
  { id:'p_pow',   name:'Мощь',      icon:77, max:10, pool:'T', param:2, per:5 },
  { id:'p_guard', name:'Стойкость', icon:81, max:10, pool:'T', param:3, per:4, hp:30 },
  { id:'p_wis',   name:'Мудрость',  icon:79, max:10, pool:'T', param:4, per:5, mp:8 },
  { id:'p_swift', name:'Прыть',     icon:82, max:10, pool:'T', param:6, per:3 },
];

// which skills the actor can upgrade: its learned class skills + racial signature
Game_Actor.prototype.upgradableSkills = function() {
  var self = this, ids = [];
  (this.currentClass().learnings || []).forEach(function(l) {
    if (l.level <= self.level && ids.indexOf(l.skillId) < 0) ids.push(l.skillId);
  });
  var racial = [0,32,33,34,35,36,37][$gameVariables.value(1)];
  if (racial && this.isLearnedSkill(racial) && ids.indexOf(racial) < 0) ids.push(racial);
  return ids;
};

function SKILLTREE_buildNodes(actor) {
  var nodes = [];
  SKILLTREE_ATTR.forEach(function(n, i) { nodes.push(Object.assign({ col:0, row:i }, n)); });
  SKILLTREE_PASSIVE.forEach(function(n, i) { nodes.push(Object.assign({ col:1, row:i }, n)); });
  actor.upgradableSkills().forEach(function(sid, i) {
    var sk = $dataSkills[sid]; if (!sk) return;
    nodes.push({ id:'sk_'+sid, col:2, row:i, name:sk.name, icon:sk.iconIndex, max:10, pool:'T', upSkill:sid });
  });
  return nodes;
}

//============================ Game_Actor =====================================
Game_Actor.prototype.treeNodeLevel = function(node) {
  if (node.upSkill) return (this._skillLv && this._skillLv[node.upSkill]) || 0;
  return (this._tree && this._tree[node.id]) || 0;
};
Game_Actor.prototype.skillUpLevel = function(skillId) { return (this._skillLv && this._skillLv[skillId]) || 0; };
Game_Actor.prototype.treeAvail = function(pool) {
  if (pool === 'A') return this.level + 4 - (this._treeSpentA || 0);    // атрибуты: 1/уровень (+5 на старте)
  return this.level + 1 - (this._treeSpentT || 0);                       // таланты: ~+2 за 2 уровня
};
Game_Actor.prototype.treeCanSpend = function(node) {
  if (this.treeNodeLevel(node) >= node.max) return false;
  return this.treeAvail(node.pool) > 0;
};
Game_Actor.prototype.treeSpend = function(node) {
  if (!this.treeCanSpend(node)) return false;
  if (node.upSkill) {
    if (!this._skillLv) this._skillLv = {};
    this._skillLv[node.upSkill] = (this._skillLv[node.upSkill] || 0) + 1;
    this._treeSpentT = (this._treeSpentT || 0) + 1;
    return true;
  }
  if (!this._tree) this._tree = {};
  this._tree[node.id] = (this._tree[node.id] || 0) + 1;
  if (node.pool === 'A') this._treeSpentA = (this._treeSpentA || 0) + 1;
  else this._treeSpentT = (this._treeSpentT || 0) + 1;
  if (node.param !== undefined) this.addParam(node.param, node.per || 0);
  if (node.hp) this.addParam(0, node.hp);
  if (node.mp) this.addParam(1, node.mp);
  this.refresh();
  return true;
};

//============================ runtime scaling ================================
// upgraded skills: more damage, less MP (scales with the actor's skill level)
var _STR_evalDmg = Game_Action.prototype.evalDamageFormula;
Game_Action.prototype.evalDamageFormula = function(target) {
  var v = _STR_evalDmg.call(this, target);
  var s = this.subject(), it = this.item();
  if (this.isSkill() && s && s.skillUpLevel && it) {
    var lv = s.skillUpLevel(it.id);
    if (lv > 0) v *= (1 + lv * SKILLTREE_DMG_PER);
  }
  return v;
};
var _STR_mpCost = Game_BattlerBase.prototype.skillMpCost;
Game_BattlerBase.prototype.skillMpCost = function(skill) {
  var c = _STR_mpCost.call(this, skill);
  if (this.skillUpLevel) {
    var lv = this.skillUpLevel(skill.id);
    if (lv > 0) c = Math.max(1, Math.round(c * (1 - lv * SKILLTREE_MP_PER)));
  }
  return c;
};

//============================ Window_TreeHelp ================================
function Window_TreeHelp() { this.initialize.apply(this, arguments); }
Window_TreeHelp.prototype = Object.create(Window_Base.prototype);
Window_TreeHelp.prototype.constructor = Window_TreeHelp;
Window_TreeHelp.prototype.initialize = function(x, y, w, h) {
  Window_Base.prototype.initialize.call(this, x, y, w, h);
  this._actor = $gameParty.leader(); this._node = null;
};
Window_TreeHelp.prototype.setNode = function(node) { this._node = node; this.refresh(); };
Window_TreeHelp.prototype.refresh = function() {
  this.contents.clear(); var a = this._actor, n = this._node; if (!a) return;
  this.changeTextColor(this.systemColor());
  this.drawText('Очки атрибутов: ' + a.treeAvail('A') + '    Очки талантов: ' + a.treeAvail('T'), 8, 0, this.contentsWidth() - 16);
  this.resetTextColor();
  if (!n) return;
  var lv = a.treeNodeLevel(n);
  this.drawText(n.name + '  (ур. ' + lv + (n.max ? '/' + n.max : '') + ')', 8, this.lineHeight(), this.contentsWidth() - 16);
  var info;
  if (n.upSkill) {
    var sk = $dataSkills[n.upSkill];
    var mpTxt = 'мана −' + Math.round(lv*SKILLTREE_MP_PER*100) + '% → −' + Math.round((lv+1)*SKILLTREE_MP_PER*100) + '%';
    if (sk && sk.damage && sk.damage.type === 1) {
      info = 'Урон +' + Math.round(lv*SKILLTREE_DMG_PER*100) + '% → +' + Math.round((lv+1)*SKILLTREE_DMG_PER*100) + '%, ' + mpTxt;
    } else {
      info = 'Эффект сильнее, ' + mpTxt;   // щиты/баффы: больше эффект, меньше маны
    }
  } else {
    var per = n.per || 0, pn = SKILLTREE_PNAME[n.param] || '';
    info = pn + ' +' + (lv*per) + ' → +' + ((lv+1)*per);
    if (n.hp) info += ', HP +' + (lv*n.hp) + ' → +' + ((lv+1)*n.hp);
    if (n.mp) info += ', MP +' + (lv*n.mp) + ' → +' + ((lv+1)*n.mp);
  }
  this.drawText(info, 8, this.lineHeight()*2, this.contentsWidth() - 16);
  var ok = a.treeCanSpend(n);
  this.changeTextColor(ok ? this.powerUpColor() : this.deathColor());
  this.drawText(ok ? 'Вложить: Enter' : (lv >= n.max ? 'Максимум' : 'Нет очков'), 8, this.lineHeight()*2, this.contentsWidth() - 16, 'right');
  this.resetTextColor();
};

//============================ Window_Tree ====================================
function Window_Tree() { this.initialize.apply(this, arguments); }
Window_Tree.prototype = Object.create(Window_Selectable.prototype);
Window_Tree.prototype.constructor = Window_Tree;
Window_Tree.prototype.initialize = function(x, y, w, h) {
  this._actor = $gameParty.leader();
  this._nodes = SKILLTREE_buildNodes(this._actor);
  Window_Selectable.prototype.initialize.call(this, x, y, w, h);
  this.refresh(); this.select(0); this.activate();
};
Window_Tree.prototype.maxItems = function() { return this._nodes.length; };
Window_Tree.prototype.colW = function() { return Math.floor(this.contentsWidth() / 3); };
Window_Tree.prototype.rowH = function() { return 58; };
Window_Tree.prototype.itemRect = function(i) {
  var n = this._nodes[i];
  return new Rectangle(n.col*this.colW() + 6, n.row*this.rowH() + 28, this.colW() - 12, this.rowH() - 8);
};
Window_Tree.prototype.drawAllItems = function() {
  this.changeTextColor(this.systemColor());
  this.drawText('АТРИБУТЫ', 6, 0, this.colW(), 'center');
  this.drawText('ПАССИВКИ', this.colW()+6, 0, this.colW(), 'center');
  this.drawText('НАВЫКИ', this.colW()*2+6, 0, this.colW(), 'center');
  this.resetTextColor();
  for (var c = 0; c < 3; c++) {
    var col = this._nodes.filter(function(x) { return x.col === c; });
    for (var k = 0; k < col.length - 1; k++) {
      var cx = c*this.colW() + 24, y1 = col[k].row*this.rowH() + 28 + this.rowH() - 10;
      this.contents.fillRect(cx, y1, 2, 10, this.systemColor());
    }
  }
  for (var i = 0; i < this.maxItems(); i++) this.drawItem(i);
};
Window_Tree.prototype.drawItem = function(i) {
  var n = this._nodes[i], r = this.itemRect(i), a = this._actor;
  var lv = a.treeNodeLevel(n);
  this.drawIcon(n.icon, r.x, r.y + 2);
  this.drawText(n.name, r.x + 38, r.y, r.width - 38);
  this.drawText('ур.' + lv + (n.max ? '/' + n.max : ''), r.x + 38, r.y + 24, r.width - 38);
};
Window_Tree.prototype.moveCursor = function(dc, dr) {
  var n = this._nodes[this.index()], col = n.col + dc, row = n.row + dr;
  var inCol = this._nodes.filter(function(x) { return x.col === col; });
  if (inCol.length === 0) return;
  var target = inCol.reduce(function(best, x) { return Math.abs(x.row-row) < Math.abs(best.row-row) ? x : best; });
  var idx = this._nodes.indexOf(target);
  if (idx !== this.index()) { this.select(idx); SoundManager.playCursor(); }
};
Window_Tree.prototype.cursorDown = function() { this.moveCursor(0, 1); };
Window_Tree.prototype.cursorUp = function() { this.moveCursor(0, -1); };
Window_Tree.prototype.cursorRight = function() { this.moveCursor(1, 0); };
Window_Tree.prototype.cursorLeft = function() { this.moveCursor(-1, 0); };
Window_Tree.prototype.updateHelp = function() { if (this._helpWindow) this._helpWindow.setNode(this._nodes[this.index()]); };
Window_Tree.prototype.isOkEnabled = function() { return true; };
Window_Tree.prototype.processOk = function() {
  this.updateInputData();
  var n = this._nodes[this.index()];
  if (this._actor.treeSpend(n)) { SoundManager.playUseSkill(); this.refresh(); this.updateHelp(); }
  else SoundManager.playBuzzer();
  this.activate();
};

//============================ Scene_SkillTree ================================
function Scene_SkillTree() { this.initialize.apply(this, arguments); }
Scene_SkillTree.prototype = Object.create(Scene_MenuBase.prototype);
Scene_SkillTree.prototype.constructor = Scene_SkillTree;
Scene_SkillTree.prototype.create = function() {
  Scene_MenuBase.prototype.create.call(this);
  var hh = 3 * 36 + 18 * 2;
  this._helpWindow = new Window_TreeHelp(0, 0, Graphics.boxWidth, hh);
  this.addWindow(this._helpWindow);
  this._treeWindow = new Window_Tree(0, hh, Graphics.boxWidth, Graphics.boxHeight - hh);
  this._treeWindow.setHelpWindow(this._helpWindow);
  this._treeWindow.setHandler('cancel', this.popScene.bind(this));
  this.addWindow(this._treeWindow);
  this._treeWindow.updateHelp();
};

//============================ Menu command ==================================
var _STR_addOrig = Window_MenuCommand.prototype.addOriginalCommands;
Window_MenuCommand.prototype.addOriginalCommands = function() {
  _STR_addOrig.call(this);
  this.addCommand('Древо', 'skilltree', true);
};
var _STR_createCmd = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
  _STR_createCmd.call(this);
  this._commandWindow.setHandler('skilltree', this.commandSkillTree.bind(this));
};
Scene_Menu.prototype.commandSkillTree = function() { SceneManager.push(Scene_SkillTree); };

//============================ skill list filter =============================
function STR_allowedSkill(actor, id) {
  if (id >= 29 && id <= 39) return true;
  var lns = actor.currentClass().learnings || [];
  for (var i = 0; i < lns.length; i++) if (lns[i].skillId === id && lns[i].level <= actor.level) return true;
  return false;
}
var _STR_skills = Game_Actor.prototype.skills;
Game_Actor.prototype.skills = function() {
  var list = _STR_skills.call(this);
  if (!this.currentClass) return list;
  var self = this;
  return list.filter(function(s) { return s && STR_allowedSkill(self, s.id); });
};
