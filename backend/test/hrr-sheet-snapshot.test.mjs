import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sheetTeamRows } from '../src/hrr.js';

test('sheetTeamRows keeps the sheet numbers as they are, per university and team', () => {
  const rows = [
    ['Място в Класация', 'Университет', 'Екип', 'Компания', 'Точки Активност', 'Точки от Мисии'],
    ['109', 'СУ', 'Екип 11', 'Плеги', '14', '33', '3', '1', '1', '', '', '', '', '58'],
    ['31', 'НБУ', 'Екип 31', 'Х', '', '31', '', '', '', '', '', '', '', '31'],
    ['', 'УНСС', '#REF!'],
    ['5', 'СУ', 'Екип 11', 'дубликат', '99', '99', '', '', '', '', '', '', '', '999']
  ];
  const teams = sheetTeamRows(rows);
  assert.deepEqual(Object.keys(teams), ['СУ::Екип 11', 'НБУ::Екип 31']);
  assert.deepEqual(teams['СУ::Екип 11'], { activity: 14, missions: 33, pleggi: 3, found: 1, easy: 1, medium: 0, hard: 0, interviews: 0, hired: 0, total: 58 });
  assert.equal(teams['НБУ::Екип 31'].total, 31);
  assert.equal(teams['НБУ::Екип 31'].activity, 0);
});
