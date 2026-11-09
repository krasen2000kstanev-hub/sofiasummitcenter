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

test('syncRoster writes only new or moved emails, so the cron can run every 5 minutes', async () => {
  const { syncRoster } = await import('../src/hrr.js');
  const roster = new Map([['ana@mail.bg', 'hrr_team_s9_nbu_1']]); const writes = [];
  const DB = { prepare: (sql) => ({ bind: (...args) => ({
    first: async () => (/hrr_seasons/.test(sql) ? { id: 's9', slug: 's9' } : /FROM hrr_teams/.test(sql) ? { id: args[0] } : null),
    all: async () => ({ results: [...roster].map(([email, team_id]) => ({ email, team_id })) }),
    run: async () => { writes.push(args); },
  }), first: async () => ({ id: 's9', slug: 's9' }) }) };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(url.includes('gid=434191220') ? 'Екип №,Име 1,Имейл,Тел,Име 2,Имейл,Тел\n1,Ана,ana@mail.bg,1,Иво,ivo@mail.bg,2\n' :'Екип №\n');
  try {
    const result = await syncRoster({ DB }, 'sheet-id-1234567890123456789');
    assert.equal(result.ok, true);
    assert.deepEqual(writes, [['s9', 'ivo@mail.bg', 'hrr_team_s9_nbu_1']]);
  } finally { globalThis.fetch = realFetch; }
});

test('missionSheetUpdates writes F only for ranked teams whose mission points changed', async () => {
  const { missionSheetUpdates } = await import('../src/hrr.js');
  const rows = [
    ['Място', 'Университет', 'Екип', 'Компания', 'Активност', 'Мисии'],
    ['1', 'НБУ', 'Екип 1', 'Фикосота', '', ''],
    ['2', 'СУ', 'Екип 4', 'Лидл', '', '5'],
    ['3', 'УНСС', 'Екип 9', 'Холсим', '', '3'],
    ['', 'НБУ', 'Екип 1', '', '', ''],
  ];
  const points = new Map([['НБУ::Екип 1', 6], ['СУ::Екип 4', 5], ['УНСС::Екип 9', 0]]);
  assert.deepEqual(missionSheetUpdates(rows, points), [
    { range: "'Обща класация'!F2", values: [[6]] },
    { range: "'Обща класация'!F4", values: [[0]] },
  ]);
});
