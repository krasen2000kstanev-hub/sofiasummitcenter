import assert from 'node:assert/strict';
import { test } from 'node:test';
import { positionLevels, levelFor, difficultyUpdates, companyKey } from '../src/hrr-difficulty.js';

const positions = positionLevels([
  ['Компания', 'Позиция', 'Линк', 'Трудност'],
  ['Плеги', 'Складов работник, София', '', 'средна'],
  ['', 'Служител щандова витрина и топла точка, София', '', 'лесна'],
  ['Кауфланд', 'Служители в отдели на пълно работно време, ж.к. Дружба', '', 'лесна'],
  ['', 'Касиери на пълно работно време, ж.к. Горубляне', '', 'лесна '],
  ['ИзиКредит', 'Social Media and Content Marketing Specialist', '', 'средна '],
  ['Спортал.бг', 'Graphic Designer ', '', 'лесна'],
  ['Холсим', 'ШЛОСЕР - МОНТЬОР', '', 'трудна'],
]);

test('difficulty comes from the positions sheet; several positions → the hardest', () => {
  assert.equal(companyKey('Pleggi (Hr: Rush For Practice)'), 'плеги');
  assert.equal(levelFor('Складов работник, Служител щандова витрина и топла точка (2 на 2)', 'плеги', positions), 'средна');
  assert.equal(levelFor('Служители в отдели на пълно работно време', 'кауфланд', positions), 'лесна');
  assert.equal(levelFor('Касиер/Продавач-консултант', 'кауфланд', positions), 'лесна');
  // A role of another company is found there.
  assert.equal(levelFor('Graphic Designer, Social Media and Content Marketing Specialist', 'спортал', positions), 'средна');
  assert.equal(levelFor('ШЛОСЕР - МОНТЬОР', 'лидл', positions), 'трудна');
  assert.equal(levelFor('нещо непознато', 'кауфланд', positions), '');
});

test('fills empty or outdated cells, never overwrites other text', () => {
  const rows = [
    ['Дата', 'Екип', 'Име', 'Телефон', 'E-mail', 'CV', 'LinkedIn', 'Pleggi', 'Сфера', 'Трудност', 'Място'],
    ['', '', '', '', '', '', '', '', 'Складов работник', ''],
    ['', '', '', '', '', '', '', '', 'Складов работник', 'средна'],
    ['', '', '', '', '', '', '', '', 'Складов работник', 'лесна'],
    ['', '', '', '', '', '', '', '', 'Складов работник', 'София'],
    ['', '', '', '', '', '', '', '', 'непознато', ''],
  ];
  assert.deepEqual(difficultyUpdates(rows, 'плеги', positions, 'Pleggi'), [
    { range: "'Pleggi'!J2", values: [['средна']] },
    { range: "'Pleggi'!J4", values: [['средна']] },
  ]);
});
