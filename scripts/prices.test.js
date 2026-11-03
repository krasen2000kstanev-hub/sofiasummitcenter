// Run with: node --test scripts/prices.test.js
const test = require('node:test');
const assert = require('node:assert');
const { toPrice, wholeNumber, countOrZero, durationBand, guestBand, extraPrice, reelsTotal, calculateQuote } = require('../prices.js');

test('an empty price means on request, not free', () => {
  assert.strictEqual(toPrice(''), null);
  assert.strictEqual(toPrice('  '), null);
  assert.strictEqual(toPrice(undefined), null);
  assert.strictEqual(toPrice('abc'), null);
  assert.strictEqual(toPrice('-5'), null);
  assert.strictEqual(toPrice('0'), 0);
  assert.strictEqual(toPrice('350'), 350);
});

test('invalid hours and guests fall back to a valid whole number', () => {
  assert.strictEqual(wholeNumber('', 24), 1);
  assert.strictEqual(wholeNumber('0', 24), 1);
  assert.strictEqual(wholeNumber('-3', 24), 1);
  assert.strictEqual(wholeNumber('3.9', 24), 3);
  assert.strictEqual(wholeNumber('500', 150), 150);
});

test('counts may be zero but never negative or fractional', () => {
  assert.strictEqual(countOrZero(''), 0);
  assert.strictEqual(countOrZero('-2'), 0);
  assert.strictEqual(countOrZero('0'), 0);
  assert.strictEqual(countOrZero('2.7'), 2);
});

test('duration bands switch after 4 and after 8 hours', () => {
  assert.strictEqual(durationBand(1), 'up4');
  assert.strictEqual(durationBand(4), 'up4');
  assert.strictEqual(durationBand(5), 'up8');
  assert.strictEqual(durationBand(8), 'up8');
  assert.strictEqual(durationBand(9), null);
});

test('100 guests is still the lower band', () => {
  assert.strictEqual(guestBand(100), 'small');
  assert.strictEqual(guestBand(101), 'large');
});

test('video and photo use the band price', () => {
  assert.strictEqual(extraPrice(250, 350, null, 4), 250);
  assert.strictEqual(extraPrice(250, 350, null, 5), 350);
  assert.strictEqual(extraPrice(200, 280, null, 8), 280);
});

test('the photo booth adds 60 EUR for each hour over 4', () => {
  assert.strictEqual(extraPrice(300, 300, 60, 4), 300);
  assert.strictEqual(extraPrice(300, 300, 60, 5), 360);
  assert.strictEqual(extraPrice(300, 300, 60, 8), 540);
});

test('extras over 8 hours or without a price are on request', () => {
  assert.strictEqual(extraPrice(250, 350, null, 9), null);
  assert.strictEqual(extraPrice(null, null, null, 2), null);
});

test('reel price per piece depends on the size of the order', () => {
  const tiers = [{ max: 3, price: 35 }, { max: 5, price: 30 }, { max: 7, price: 25 }];
  assert.strictEqual(reelsTotal(0, tiers), 0);
  assert.strictEqual(reelsTotal(1, tiers), 35);
  assert.strictEqual(reelsTotal(3, tiers), 105);
  assert.strictEqual(reelsTotal(4, tiers), 120);
  assert.strictEqual(reelsTotal(5, tiers), 150);
  assert.strictEqual(reelsTotal(6, tiers), 150);
  assert.strictEqual(reelsTotal(7, tiers), 175);
  assert.strictEqual(reelsTotal(8, tiers), null);
});

test('adds extras to the room price', () => {
  const quote = calculateQuote(450, [{ label: 'Видео', price: 350 }, { label: 'Фото', price: 280 }]);
  assert.strictEqual(quote.total, 1080);
  assert.deepStrictEqual(quote.pending, []);
});

test('a room on request gives no total', () => {
  assert.strictEqual(calculateQuote(null, [{ label: 'Видео', price: 250 }]).total, null);
});

test('an extra on request is listed and left out of the total', () => {
  const quote = calculateQuote(100, [{ label: 'Лендинг', price: null }, { label: 'Фото', price: 200 }]);
  assert.strictEqual(quote.total, 300);
  assert.deepStrictEqual(quote.pending, ['Лендинг']);
});
