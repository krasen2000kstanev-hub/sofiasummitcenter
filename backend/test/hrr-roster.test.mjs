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
    { number: 1, emails: ['ana@mail.bg', 'ivo@mail.bg'], names: { 'ana@mail.bg': 'Ана', 'ivo@mail.bg': 'Иво' } },
    { number: 2, emails: ['maya@mail.bg'], names: { 'maya@mail.bg': 'Мая' } },
  ]);
});

test('maskMission hides secret and bonus content from students', async () => {
  const { maskMission } = await import('../src/hrr.js');
  assert.deepEqual(maskMission({ kind: 'secret', title: 'Истинско', description: 'Тайно', points: 5 }), { kind: 'secret', title: 'Тайна мисия', description: '', points: 5, has_image: 0 });
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
  }), first: async () => ({ id: 's9', slug: 's9' }), all: async () => ({ results: [] }) }) };
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
  assert.deepEqual(missionSheetUpdates(rows, points, 'Обща класация на екипи'), [
    { range: "'Обща класация на екипи'!F2", values: [[6]] },
    { range: "'Обща класация на екипи'!F4", values: [[0]] },
  ]);
});

test('isBlockedEmail matches organizer-blocked addresses case-insensitively', async () => {
  const { isBlockedEmail } = await import('../src/hrr-auth.js');
  const env = { HRR_BLOCKED_EMAILS: 'z.raponqrova@pgzknezha.bg, other@x.bg' };
  assert.equal(isBlockedEmail(env, 'Z.Raponqrova@PGZKnezha.bg'), true);
  assert.equal(isBlockedEmail(env, 'z.raponqrova@pgzknezha.com'), false);
  assert.equal(isBlockedEmail({}, 'any@x.bg'), false);
});

test('photo evidence must be a small image data URL and bonus points are clamped', async () => {
  const { isEvidenceImage, bonusPoints } = await import('../src/hrr.js');
  assert.equal(isEvidenceImage('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
  assert.equal(isEvidenceImage('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.equal(isEvidenceImage('https://example.com/a.jpg'), false);
  assert.equal(isEvidenceImage('data:image/png;base64,' + 'A'.repeat(1_400_000)), false);
  assert.equal(bonusPoints('3'), 3);
  assert.equal(bonusPoints(-5), 0);
  assert.equal(bonusPoints('abc'), 0);
  assert.equal(bonusPoints(5000), 1000);
});

test('missionNumbers parses a free-form list of mission numbers', async () => {
  const { missionNumbers } = await import('../src/hrr.js');
  assert.deepEqual(missionNumbers('1, 2'), [1, 2]);
  assert.deepEqual(missionNumbers('0;1 1  x -3'), [0, 1]);
  assert.deepEqual(missionNumbers(''), []);
});

test('rosterAlertEmail reads the email out of a roster alert body', async () => {
  const { rosterAlertEmail } = await import('../src/hrr.js');
  assert.equal(rosterAlertEmail('Sahooo · Sahooo3@abv.bg не е в списъка с участници. Свържи се.'), 'sahooo3@abv.bg');
  assert.equal(rosterAlertEmail('a@b.bg · a@b.bg е в списъка, но отборът му вече има 2 участници.'), 'a@b.bg');
  assert.equal(rosterAlertEmail('no separator'), '');
});

test('rosterContactEmail asks for name, university and team number', async () => {
  const { rosterContactEmail } = await import('../src/hrr.js');
  const mail = rosterContactEmail('a@b.bg');
  assert.match(mail.text, /a@b\.bg/);
  for (const part of ['Име и фамилия', 'Университет', 'Номер на екипа']) assert.ok(mail.text.includes(part));
});
