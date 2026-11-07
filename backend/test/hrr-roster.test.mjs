import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, parseRoster } from '../src/hrr.js';

test('parseRoster reads the main team block and stops before side lists', () => {
  const csv = 'Екип №,Име 1,Имейл,Тел,Име 2,Имейл,Тел,,Компания,Позиция\n'
    + '1,Ана,Ana@Mail.bg,1,Иво,mailto:ivo@mail.bg,2,,Лидл,"Касиер, София"\n'
    + '2,Мая,maya@mail.bg,3,,,,,Холсим,Инженер\n'
    + '3,,,,,,,,,\n'
    + '6,Странично Име,,,,,,,,\n';
  const rows = parseCsv(csv);
  assert.equal(rows[1][9], 'Касиер, София');
  assert.deepEqual(parseRoster(rows), [
    { number: 1, emails: ['ana@mail.bg', 'ivo@mail.bg'] },
    { number: 2, emails: ['maya@mail.bg'] },
  ]);
});
