import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emailMentor } from '../src/hrr.js';
import { mainEmail } from '../src/hrr-auth.js';

const db = (mentor) => ({ prepare: () => ({ bind() { return this; }, first: async () => mentor }) });

test('mentor gets an email about a new submission', async () => {
  const sent = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response('{}'); };
  try {
    await emailMentor({ RESEND_API_KEY: 'k', EMAIL_FROM: 'HR:Rush <a@b.test>', DB: db({ email: 'mentor@x.test', display_name: 'Иван Петров' }) }, { mentor_user_id: 'u1', title: 'Мисия <5>' }, 'Мария');
  } finally { globalThis.fetch = original; }
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(sent[0].body.to, ['mentor@x.test']);
  assert.match(sent[0].body.html, /Мария/);
  assert.match(sent[0].body.html, /Мисия &lt;5&gt;/);
  assert.match(sent[0].body.html, /portal=mentor/);
});

test('a failing mail service does not throw', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('down'); };
  try { await emailMentor({ RESEND_API_KEY: 'k', EMAIL_FROM: 'a@b.test', DB: db({ email: 'm@x.test' }) }, { mentor_user_id: 'u1', title: 'T' }, 'S'); }
  finally { globalThis.fetch = original; }
});

test('no email without mail settings or mentor', async () => {
  let called = false; const original = globalThis.fetch; globalThis.fetch = async () => { called = true; return new Response('{}'); };
  try {
    await emailMentor({ DB: db({ email: 'm@x.test' }) }, { mentor_user_id: 'u1', title: 'T' }, 'S');
    await emailMentor({ RESEND_API_KEY: 'k', EMAIL_FROM: 'a@b.test', DB: db(null) }, { mentor_user_id: 'u1', title: 'T' }, 'S');
  } finally { globalThis.fetch = original; }
  assert.equal(called, false);
});

test('second address signs into the main account', () => {
  const env = { HRR_EMAIL_ALIASES: ' Second@X.test = main@y.test , ' };
  assert.equal(mainEmail(env, 'second@x.test'), 'main@y.test');
  assert.equal(mainEmail(env, 'other@x.test'), 'other@x.test');
  assert.equal(mainEmail({}, 'a@b.test'), 'a@b.test');
});
