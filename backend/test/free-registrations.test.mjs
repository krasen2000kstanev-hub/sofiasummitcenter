import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, test } from 'node:test';
import { handleFreeRegistration } from '../src/free-registrations.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function makeDb() {
  const db = new DatabaseSync(':memory:');
  const wrap = (sql) => {
    let params = [];
    return {
      sql, get params() { return params; },
      bind(...values) { params = values; return this; },
      async run() { const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; },
      async first() { return db.prepare(sql).get(...params) || null; },
      async all() { return { results: db.prepare(sql).all(...params) }; }
    };
  };
  return {
    raw: db,
    prepare: wrap,
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const results = statements.map((s) => ({ meta: { changes: Number(db.prepare(s.sql).run(...s.params).changes) } }));
        db.exec('COMMIT');
        return results;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
  };
}

async function setup() {
  const env = { DB: makeDb(), RESEND_API_KEY: 'test', EMAIL_FROM: 'tickets@example.com', PUBLIC_SITE_URL: 'https://example.com' };
  // Старата схема (без organization), после миграцията, за да се провери и ALTER-ът.
  const schema = (await readFile(new URL('../schema.sql', import.meta.url), 'utf8')).replace('  organization TEXT,\n', '');
  env.DB.raw.exec(schema);
  env.DB.raw.exec(await readFile(new URL('../migrations/0038_national_youth_summit.sql', import.meta.url), 'utf8'));
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options }); return new Response(JSON.stringify({ id: 'mail_1' }), { status: 200 }); };
  return { env, calls };
}

const body = { eventSlug: 'national-youth-summit', organization: 'Студентски съвет', fullName: 'Тест Участник', phone: '0888000000', email: 'Test@Example.com', consent: true };
const post = (data) => new Request('https://api.test/api/free-registrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
const run = async (env, data) => {
  const pending = [];
  const response = await handleFreeRegistration(post(data), env, { waitUntil: (p) => pending.push(p) }, new URL('https://api.test/api/free-registrations'), {}, async (_event, _attendee, ticketUrl) => { env.lastTicketUrl = ticketUrl; return new Uint8Array([37, 80, 68, 70]); });
  await Promise.all(pending);
  return response;
};

test('регистрация: записва, праща билет и препраща към Google', async () => {
  const { env, calls } = await setup();
  const response = await run(env, body);
  assert.equal(response.status, 201);
  const row = env.DB.raw.prepare('SELECT a.*, o.status, o.amount_cents FROM attendees a JOIN orders o ON o.id = a.order_id').get();
  assert.equal(row.status, 'paid');
  assert.equal(row.amount_cents, 0);
  assert.equal(row.email, 'test@example.com');
  assert.equal(row.organization, 'Студентски съвет');
  assert.match(row.ticket_token, /^[A-HJ-NP-Z2-9]{6}$/);
  const mail = calls.find((c) => c.url.includes('resend'));
  const sent = JSON.parse(mail.options.body);
  assert.deepEqual(sent.to, ['test@example.com']);
  assert.ok(sent.html.includes(row.ticket_token));
  assert.equal(env.lastTicketUrl, `https://api.test/api/tickets/${row.ticket_token}`);
  const google = calls.find((c) => c.url.includes('docs.google.com'));
  assert.equal(google.options.body.get('entry.1191599617'), 'Студентски съвет');
  assert.equal(google.options.body.get('entry.1284682467'), 'test@example.com');
  assert.equal(env.DB.raw.prepare("SELECT status FROM email_log").get().status, 'sent');
});

test('същият имейл втори път не създава втори билет', async () => {
  const { env } = await setup();
  await run(env, body);
  const again = await run(env, body);
  assert.equal((await again.json()).already, true);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM attendees').get().n, 1);
});

test('отказва без съгласие, с лош имейл и за платено събитие', async () => {
  const { env } = await setup();
  assert.equal((await run(env, { ...body, consent: false })).status, 400);
  assert.equal((await run(env, { ...body, email: 'няма' })).status, 400);
  assert.equal((await run(env, { ...body, eventSlug: 'nail-business-restart' })).status, 404);
});

test('спира при пълен капацитет', async () => {
  const { env } = await setup();
  env.DB.raw.exec("UPDATE events SET capacity = 1 WHERE slug = 'national-youth-summit'");
  assert.equal((await run(env, body)).status, 201);
  assert.equal((await run(env, { ...body, email: 'other@example.com' })).status, 409);
});
