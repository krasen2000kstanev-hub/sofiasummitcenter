const assert = require('node:assert/strict');
const {validateRegistration} = require('../src/validation');

const valid = validateRegistration({name: 'Иван Иванов', email: 'ivan@example.com', phone: '+359888123456', parking: 'Не', consent: true});
assert.deepEqual(valid.errors, {});
assert.equal(valid.data.email, 'ivan@example.com');

const invalid = validateRegistration({name: '', email: 'bad', phone: '', parking: 'maybe', consent: false});
assert.ok(Object.keys(invalid.errors).length >= 4);

console.log('validation tests passed');
