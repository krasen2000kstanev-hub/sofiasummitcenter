const assert = require('node:assert/strict');
const test = require('node:test');
const { calculatePrice, inquiryRecipients } = require('../handler');

test('calculates ticket, name discount and parking without trusting client totals', () => {
  assert.deepEqual(calculatePrice('espresso', false, false), {
    baseAmountCents: 1200, discountCents: 0, parkingCents: 0, amountCents: 1200
  });
  assert.deepEqual(calculatePrice('doppio', true, true), {
    baseAmountCents: 2400, discountCents: 600, parkingCents: 500, amountCents: 2300
  });
  assert.deepEqual(calculatePrice('lungo', true, false), {
    baseAmountCents: 3600, discountCents: 600, parkingCents: 0, amountCents: 3000
  });
});

test('keeps both inquiry notification recipients', () => {
  assert.deepEqual(inquiryRecipients('tsvetelin@pleggi.com, krasen.k.stanev@gmail.com'), [
    'tsvetelin@pleggi.com', 'krasen.k.stanev@gmail.com'
  ]);
});
