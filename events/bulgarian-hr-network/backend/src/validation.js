const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function validateRegistration(input) {
  const data = {
    name: clean(input.name, 120),
    position: clean(input.position, 120),
    company: clean(input.company, 160),
    email: clean(input.email, 254).toLowerCase(),
    phone: clean(input.phone, 40),
    parking: clean(input.parking, 40),
    expectations: Array.isArray(input.expectations)
      ? input.expectations.map((item) => clean(item, 120)).filter(Boolean).slice(0, 10)
      : [],
    expectationsOther: clean(input.expectationsOther, 300),
    consent: input.consent === true
  };

  const errors = {};
  if (data.name.length < 2) errors.name = 'Името е задължително.';
  if (!EMAIL_RE.test(data.email)) errors.email = 'Невалиден имейл.';
  if (data.phone.length < 5) errors.phone = 'Телефонът е задължителен.';
  if (!['Да', 'Не', 'Не съм с кола'].includes(data.parking)) errors.parking = 'Избери опция за паркинг.';
  if (!data.consent) errors.consent = 'Необходимо е съгласие.';
  if (data.expectations.includes('Other') && !data.expectationsOther) errors.expectationsOther = 'Попълни другия отговор.';

  return {data, errors};
}

module.exports = {validateRegistration};
