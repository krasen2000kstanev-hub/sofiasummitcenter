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

test('maskMission hides secret and bonus content from students', async () => {
  const { maskMission } = await import('../src/hrr.js');
  assert.deepEqual(maskMission({ kind: 'secret', title: 'Истинско', description: 'Тайно', points: 5 }), { kind: 'secret', title: 'Тайна мисия', description: '', points: 5 });
  assert.equal(maskMission({ kind: 'bonus', title: 'X', description: 'Y' }).title, 'Бонус мисия');
  assert.equal(maskMission({ kind: 'regular', title: 'X', description: 'Y' }).description, 'Y');
});

test('evidence links must be http(s) and dates use Sofia calendar days', async () => {
  const { isSafeUrl, sofiaToday } = await import('../src/hrr.js');
  assert.equal(isSafeUrl('https://linkedin.com/in/x'), true);
  assert.equal(isSafeUrl('javascript:alert(1)'), false);
  assert.equal(isSafeUrl(' JAVASCRIPT:alert(1)'), false);
  // 22:30 UTC on 9 Nov is already 10 Nov in Sofia
  assert.equal(sofiaToday(new Date('2026-11-09T22:30:00Z')), '2026-11-10');
});
