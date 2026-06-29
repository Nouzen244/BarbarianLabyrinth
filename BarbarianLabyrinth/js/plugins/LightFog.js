//=============================================================================
// LightFog.js
//=============================================================================
/*:
 * @plugindesc v1.0 Тьма в лабиринте: круг видимости вокруг игрока (больше с
 * факелом, предмет id 9). Активен при включённом Switch 3.
 * @author Claude Code
 *
 * @param Active Switch
 * @desc Свет/тьма включаются, когда этот переключатель ON (лабиринт).
 * @type number
 * @default 3
 *
 * @param Base Radius
 * @desc Радиус видимости без факела (пиксели).
 * @type number
 * @default 90
 *
 * @param Torch Radius
 * @desc Радиус видимости с факелом в инвентаре (пиксели).
 * @type number
 * @default 155
 *
 * @param Torch Item
 * @desc Id предмета-факела (наличие в инвентаре = больший радиус).
 * @type number
 * @default 9
 *
 * @param Darkness
 * @desc Плотность тьмы по краю (0.0–1.0).
 * @default 0.97
 */
(function() {
  var P = PluginManager.parameters('LightFog');
  var SW = Number(P['Active Switch'] || 3);
  var BASE = Number(P['Base Radius'] || 120);
  var TORCH = Number(P['Torch Radius'] || 230);
  var ITEM = Number(P['Torch Item'] || 9);
  var DARK = Number(P['Darkness'] || 0.97);

  function Sprite_Fog() { this.initialize.apply(this, arguments); }
  Sprite_Fog.prototype = Object.create(Sprite.prototype);
  Sprite_Fog.prototype.constructor = Sprite_Fog;
  Sprite_Fog.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.bitmap = new Bitmap(Graphics.width, Graphics.height);
    this._lx = -999; this._ly = -999; this._lr = -1;
  };
  Sprite_Fog.prototype.update = function() {
    Sprite.prototype.update.call(this);
    var on = $gameSwitches.value(SW);
    this.visible = on;
    if (!on) return;
    var px = Math.round($gamePlayer.screenX());
    var py = Math.round($gamePlayer.screenY() - 20);
    var r = ($gameParty.numItems($dataItems[ITEM]) > 0) ? TORCH : BASE;
    if (px !== this._lx || py !== this._ly || r !== this._lr) {
      this._lx = px; this._ly = py; this._lr = r; this.redraw(px, py, r);
    }
  };
  Sprite_Fog.prototype.redraw = function(px, py, r) {
    var b = this.bitmap, ctx = b._context;
    b.clear();
    var g = ctx.createRadialGradient(px, py, Math.max(8, r * 0.35), px, py, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.72, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + DARK + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, b.width, b.height);
    if (b._setDirty) b._setDirty();
  };

  var _create = Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function() {
    _create.call(this);
    this._fogSprite = new Sprite_Fog();
    this._spriteset.addChild(this._fogSprite); // above the map, below the windows
  };
})();
