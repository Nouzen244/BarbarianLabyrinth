// PHASE 6 — Shops: racial shops (by Variable 1), black market (Switch 2 + raid
// risk), one-per-game limited items (Origin Seal, Barbarian Mask), and an early
// essence trader. Rewrites Map002 events 4/5, adds 8/9/10; adds Map001 event 7.
import fs from 'node:fs';
const DIR = 'E:/project/game/BarbarianLabyrinth/data';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}.json`, 'utf8'));
const write = (f, d) => fs.writeFileSync(`${DIR}/${f}.json`, JSON.stringify(d));

const wrapText = (lines, max = 30) => { const out = [];
  for (const ln of lines) { if (ln.length <= max) { out.push(ln); continue; }
    let cur = ''; for (const w of ln.split(' ')) {
      if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w; }
      else cur = (cur ? cur + ' ' : '') + w; } if (cur) out.push(cur); }
  return out; };

// ---- command-list DSL with indent tracking ----
function CL() {
  const list = []; let ind = 0;
  const push = (code, parameters = []) => { list.push({ code, indent: ind, parameters }); };
  const api = {
    text(lines) { push(101, ['', 0, 0, 2]); for (const t of wrapText(lines)) push(401, [t]); return api; },
    ifVar(v, val, cmp = 0) { push(111, [1, v, 0, val, cmp]); ind++; return api; },
    ifSwitch(s, on = true) { push(111, [0, s, on ? 0 : 1]); ind++; return api; },
    ifGold(amount, cmp = 0) { push(111, [7, amount, cmp]); ind++; return api; }, // 0:>=,1:<=,2:<
    else_() { ind--; push(411); ind++; return api; },
    end() { ind--; push(412); return api; },
    gold(delta) { push(125, [delta >= 0 ? 0 : 1, 0, Math.abs(delta)]); return api; },
    giveItem(id, q = 1) { push(126, [id, 0, 0, q]); return api; },
    setSwitch(s, on = true) { push(121, [s, s, on ? 0 : 1]); return api; },
    script(code) { const ls = code.split('\n'); push(355, [ls[0]]); for (let i = 1; i < ls.length; i++) push(655, [ls[i]]); return api; },
    shop(goods, purchaseOnly = false) { push(302, [...goods[0], purchaseOnly]); for (let i = 1; i < goods.length; i++) list.push({ code: 605, indent: ind, parameters: goods[i] }); return api; },
    choices(opts) { push(102, [opts, 0, 0, 2, 0]); return api; },
    when(idx, label) { push(402, [idx, label]); ind++; return api; },
    whenEnd() { ind--; return api; },
    choiceEnd() { push(404); return api; },
    stop() { push(0); return api; },
    done() { return list; },
  };
  return api;
}

// goods helpers: I=item, W=weapon, A=armor  (priceType 0 = DB price)
const I = id => [0, id, 0, 0], W = id => [1, id, 0, 0], A = id => [2, id, 0, 0];
const Icustom = (id, price) => [0, id, 1, price];

// ---- event wrapper ----
const route = { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false };
const img = (name, idx = 0) => ({ tileId: 0, characterName: name, direction: 2, pattern: 1, characterIndex: idx });
function event(id, name, x, y, image, list, priority = 1, trigger = 0) {
  return { id, name, note: '', x, y, pages: [{
    conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: 'A',
      selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false,
      variableId: 1, variableValid: false, variableValue: 0 },
    directionFix: false, image, list, moveFrequency: 3, moveRoute: route, moveSpeed: 3,
    moveType: 0, priorityType: priority, stepAnime: false, through: false, trigger, walkAnime: true }] };
}

// ============ RACIAL SHOP (Map002 event 4) ============
const RACE_SHOPS = {
  1: { who: 'Варварская лавка', goods: [I(1), I(2), I(7), W(4), A(13), I(11), I(12)] },
  2: { who: 'Эльфийская лавка',  goods: [I(2), I(4), W(7), W(10), A(12), A(11), I(15), I(16)] },
  3: { who: 'Лавка магов',       goods: [I(4), W(6), A(5), A(7), A(11), I(13), I(14)] },
  4: { who: 'Гномья кузня',      goods: [I(2), W(3), W(4), W(11), A(9), A(2), A(4), A(10)] },
  5: { who: 'Лавка драконидов',  goods: [I(3), W(12), W(2), A(9), I(13), I(17)] },
  6: { who: 'Золотое хранилище', goods: [I(3), I(17), I(18), I(19), A(9), A(11), A(10)] },
};
const racial = CL();
for (const [race, s] of Object.entries(RACE_SHOPS)) {
  racial.ifVar(1, Number(race));
  racial.text([`${s.who}: товары для своих.`]).shop(s.goods);
  racial.end();
}
racial.stop();

// ============ BLACK MARKET (Map002 event 5) ============
const blackGoods = [Icustom(15, 600), Icustom(16, 600), Icustom(17, 1200), Icustom(18, 1200), Icustom(19, 1800)];
const black = CL()
  .ifSwitch(2, true)
    .text(['Контрабандистка: запретный товар. Цена — тройная.'])
    .shop(blackGoods, false)
    .script("$gameSwitches.setValue(50, Math.random() < 0.25);\nif ($gameSwitches.value(50)) $gameVariables.setValue(3, Math.min(100, $gameVariables.value(3) + 10));")
    .ifSwitch(50, true)
      .text(['ОБЛАВА! Стража нагрянула на рынок. Подозрение +10.'])
    .end()
  .else_()
    .text(['Дверь заколочена. Нужен тот, кто проведёт внутрь.'])
  .end()
  .stop();

// ============ Контрабандист — unlock black market (event 8) ============
const smuggler = CL()
  .ifSwitch(2, false)
    .text(['\\n<Контрабандистка>Ищешь запретное? Проведу... за молчание.'])
    .choices(['Договориться', 'Уйти'])
      .when(0, 'Договориться')
        .setSwitch(2, true)
        .text(['Чёрный рынок открыт. Но берегись облав.'])
      .whenEnd()
      .when(1, 'Уйти').whenEnd()
    .choiceEnd()
  .else_()
    .text(['Контрабандистка кивает на заколоченную дверь рядом.'])
  .end()
  .stop();

// ============ Старейшина племени — Маска варвара, 1/игру (event 9) ============
const elder = CL()
  .ifSwitch(22, false)
    .text(['\\n<Старейшина>Прими Маску предков — она скроет твою чуждость.'])
    .giveItem(22, 1)
    .setSwitch(22, true)
    .text(['Получена Маска варвара. Используй её, чтобы снять 30 Подозрения.'])
  .else_()
    .text(['Старейшина: Маска уже у тебя. Носи с честью.'])
  .end()
  .stop();

// ============ Хранитель печатей — Печать Первородного, 1/игру (event 10) ============
const seal = CL()
  .ifSwitch(21, false)
    .text(['\\n<Хранитель>Печать Первородного. 3000 золота.', 'Одна на всю жизнь.'])
    .choices(['Купить (3000)', 'Отказаться'])
      .when(0, 'Купить (3000)')
        .ifGold(3000, 0)
          .gold(-3000).giveItem(21, 1).setSwitch(21, true)
          .text(['Печать твоя. Используй её — навсегда +1 слот эссенций.'])
        .else_()
          .text(['Не хватает золота.'])
        .end()
      .whenEnd()
      .when(1, 'Отказаться').whenEnd()
    .choiceEnd()
  .else_()
    .text(['Хранитель: Печать уже продана тебе. Второй не будет.'])
  .end()
  .stop();

// ===================== WRITE =====================
const city = read('Map002');
city.events[4] = event(4, 'Расовый магазин', 13, 8, img('!Door1', 1), racial.done());
city.events[5] = event(5, 'Чёрный рынок', 18, 8, img('!Door2', 0), black.done());
city.events[8] = event(8, 'Контрабандистка', 20, 11, img('People3', 2), smuggler.done());
city.events[9] = event(9, 'Старейшина племени', 6, 11, img('People3', 0), elder.done());
city.events[10] = event(10, 'Хранитель печатей', 21, 8, img('People4', 3), seal.done());
write('Map002', city);
// (the in-labyrinth essence trader now lives on Map006, see gen_phase10)

console.error('Racial shops:', Object.keys(RACE_SHOPS).length,
  '| Map002 events:', city.events.filter(Boolean).length);
