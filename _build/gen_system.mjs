// Sets the game title and names the documented Switches/Variables in System.json.
// Extends switch/variable banks to 100 each for headroom. Re-runnable.
import fs from 'node:fs';

const SYS = 'E:/project/game/BarbarianLabyrinth/data/System.json';
const sys = JSON.parse(fs.readFileSync(SYS, 'utf8'));

sys.gameTitle = 'Варвар в Лабиринте';
sys.locale = 'ru_RU';

const SWITCH_NAMES = {
  1: 'Игра началась (раса выбрана)',
  2: 'Чёрный рынок открыт',
  3: 'В лабиринте',
  4: 'Разлом активен',
  5: 'Разоблачён как злой дух',
  10: 'Босс 1 этажа повержен',
  11: 'Босс 2 этажа повержен',
  12: 'Босс 3 этажа повержен',
  21: 'Печать Первородного куплена',
  22: 'Маска варвара получена',
  50: '(врем.) Облава на чёрном рынке',
  51: '(врем.) Погиб в лабиринте',
};
const VARIABLE_NAMES = {
  1: 'Раса (1Варв 2Эльф 3Маг 4Гном 5Драк 6Рояль)',
  2: 'Класс',
  3: 'Подозрение (0-100)',
  4: 'Дни (таймер 1-30)',
  5: 'Этаж',
  6: 'Золото (ref)',
  7: 'Репутация',
  10: 'Голод (0-100)',
  11: 'Усталость (0-100)',
  12: 'Рассудок (0-100)',
  20: 'Эссенция: слот 1',
  21: 'Эссенция: слот 2',
  22: 'Эссенция: слот 3',
  23: 'Эссенция: слот 4',
  24: 'Слотов эссенций (4, варвар 6)',
  93: '(врем.) Лабиринт: минут до открытия',
  94: '(врем.) Лабиринт: время закрытия',
  99: '(врем.) Потеряно золота',
};

function bank(existing, names, size = 100) {
  const arr = new Array(size + 1).fill('');
  // keep any pre-existing names
  for (let i = 0; i < existing.length && i <= size; i++) arr[i] = existing[i] || '';
  for (const [i, n] of Object.entries(names)) arr[Number(i)] = n;
  arr[0] = '';
  return arr;
}

sys.switches = bank(sys.switches, SWITCH_NAMES);
sys.variables = bank(sys.variables, VARIABLE_NAMES);

fs.writeFileSync(SYS, JSON.stringify(sys));
console.error('System.json updated. title="%s" switches=%d variables=%d',
  sys.gameTitle, sys.switches.length - 1, sys.variables.length - 1);
console.error('Named switches:', Object.keys(SWITCH_NAMES).length, ' Named variables:', Object.keys(VARIABLE_NAMES).length);
