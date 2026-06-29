//=============================================================================
// Rarity.js  (Phase A of the gear-rarity system)
//=============================================================================
/*:
 * @plugindesc v1.0 Редкость снаряжения: 6 рангов (цвет имени + бонус % к
 * характеристикам), ролл при получении независимого оружия/брони.
 * @author Claude Code
 *
 * @help
 * Требует YEP_ItemCore с независимым оружием/бронёй (Max Weapons/Armors > 0).
 * Каждое новое независимое оружие/броня получает случайный ранг редкости:
 * имя красится цветом ранга и к характеристикам применяется множитель.
 * Глобально доступны window.RARITY, window.rollRarity(bonus), window.applyRarity.
 * bonus (число) сдвигает ролл к высоким рангам (для глубоких сундуков).
 */
(function() {
  // [name, textColor (индекс палитры windowskin), weight, statMult]
  var RARITY = [
    { name: 'Обычный',     color: 0,  weight: 50, mult: 1.00 },  // белый
    { name: 'Необычный',   color: 3,  weight: 26, mult: 1.05 },  // зелёный
    { name: 'Особый',      color: 1,  weight: 13, mult: 1.10 },  // синий
    { name: 'Редкий',      color: 5,  weight: 7,  mult: 1.15 },  // розово-фиолетовый
    { name: 'Магический',  color: 2,  weight: 3,  mult: 1.20 },  // красный
    { name: 'Легендарный', color: 14, weight: 1,  mult: 1.25 },  // жёлтый
  ];
  window.RARITY = RARITY;

  // максимальная редкость по текущему этажу: 1-10 зел … 41-50 лег; город — до синей
  window.rarityCap = function() {
    var id = $gameMap ? $gameMap.mapId() : 0;
    if (id >= 101 && id <= 150) return Math.min(5, Math.ceil((id - 100) / 10));
    return 2;   // город/прочее — максимум Особый (синий)
  };

  // ролл редкости, ограниченный maxR (по умолчанию — кап текущего этажа).
  // максимум выпадает РЕДКО (веса), т.е. не всегда максимум по этажу.
  window.rollRarity = function(maxR) {
    if (maxR === undefined || maxR === null) maxR = window.rarityCap();
    maxR = Math.max(0, Math.min(5, maxR));
    var total = 0, i;
    for (i = 0; i <= maxR; i++) total += RARITY[i].weight;
    var roll = Math.random() * total;
    for (i = 0; i <= maxR; i++) { roll -= RARITY[i].weight; if (roll < 0) return i; }
    return 0;
  };

  window.applyRarity = function(item, rank) {
    if (!item) return;
    item.rarity = rank;
    item.textColor = RARITY[rank].color;
    if (item.params) {
      for (var i = 0; i < item.params.length; i++) {
        if (item.params[i]) item.params[i] = Math.round(item.params[i] * RARITY[rank].mult);
      }
    }
    item.namePrefix = RARITY[rank].name + ' ';
    ItemManager.updateItemName(item);
  };

  // every new independent weapon/armor rolls a rarity on creation
  var _customize = ItemManager.customizeNewIndependentItem;
  ItemManager.customizeNewIndependentItem = function(baseItem, newItem) {
    _customize.call(this, baseItem, newItem);
    // check baseItem: newItem isn't pushed into $dataWeapons/$dataArmors yet here,
    // so DataManager.isWeapon(newItem) would be false. baseItem IS in the database.
    if ((DataManager.isWeapon(baseItem) || DataManager.isArmor(baseItem)) && newItem.rarity === undefined) {
      window.applyRarity(newItem, window.rollRarity());   // capped by current floor (rarityCap)
    }
  };

  // retro-fit: give any pre-existing independent gear (from an old save) a rarity
  // once on map load (guarded by rarity===undefined so it never re-rolls)
  var _onMapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    _onMapLoaded.call(this);
    if (!$gameParty) return;
    var list = $gameParty.weapons().concat($gameParty.armors());
    $gameParty.members().forEach(function(a) { list = list.concat(a.equips().filter(Boolean)); });
    list.forEach(function(it) {
      if (it && it.baseItemId && it.rarity === undefined &&
          (DataManager.isWeapon(it) || DataManager.isArmor(it))) {
        window.applyRarity(it, window.rollRarity(2));   // retro-fit old gear: up to Особый
      }
    });
  };
})();
