import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, test } from 'node:test';
import { processHrrApplicationOutbox, submitHrrApplication } from '../src/hrr-applications.js';

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

function makeDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  return {
    raw: db,
    prepare(sql) {
      let params = [];
      const statement = {
        sql,
        get params() { return params; },
        bind(...values) { params = values; return this; },
        async run() {
          const result = db.prepare(sql).run(...params);
          return { meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
        },
        async first() { return db.prepare(sql).get(...params) || null; },
        async all() { return { results: db.prepare(sql).all(...params) }; }
      };
      return statement;
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const results = statements.map((statement) => {
          const result = db.prepare(statement.sql).run(...statement.params);
          return { meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
        });
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

const validApplication = {
  role: 'student', firstName: 'Тест', lastName: 'Кандидат', organization: '',
  university: 'УНСС', specialty: 'HR', phone: '+359 888 000 000',
  email: 'candidate@example.com', gdprConsent: true, season: 1
};

async function setup() {
  const env = { DB: makeDb(), HRR_APPLICATION_SEASON: '9' };
  const migration = await readFile(new URL('../migrations/0013_hrr_applications.sql', import.meta.url), 'utf8');
  env.DB.raw.exec(migration);
  const positionMigration = await readFile(new URL('../migrations/0014_hrr_application_position.sql', import.meta.url), 'utf8');
  env.DB.raw.exec(positionMigration);
  return env;
}

function request(body) {
  return new Request('https://local.test/api/apply', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
}

test('rejects missing consent without persisting personal data', async () => {
  const env = await setup();
  const response = await submitHrrApplication(request({ ...validApplication, gdprConsent: false }), env, null);
  assert.equal(response.status, 400);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM hrr_applications').get().n, 0);
});

test('stores valid submission and its three outbox jobs atomically using configured season', async () => {
  const env = await setup();
  const response = await submitHrrApplication(request(validApplication), env, null);
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(JSON.stringify(body).includes('candidate@example.com'), false);
  assert.equal(env.DB.raw.prepare('SELECT season FROM hrr_applications').get().season, 9);
  assert.deepEqual(
    env.DB.raw.prepare('SELECT kind FROM hrr_application_outbox ORDER BY kind').all().map((row) => row.kind),
    ['applicant_email', 'organizer_email', 'sheet']
  );
});

test('requires and stores a company representative position', async () => {
  const env = await setup();
  const companyApplication = { ...validApplication, role: 'company', organization: 'Пример ООД', university: '', specialty: 'Представител на компания', position: 'HR мениджър' };
  const missingPosition = await submitHrrApplication(request({ ...companyApplication, position: '' }), env, null);
  assert.equal(missingPosition.status, 400);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM hrr_applications').get().n, 0);

  const response = await submitHrrApplication(request(companyApplication), env, null);
  assert.equal(response.status, 201);
  assert.equal(env.DB.raw.prepare('SELECT position FROM hrr_applications').get().position, 'HR мениджър');
});

test('does not leave an application behind if creating its outbox fails', async () => {
  const env = await setup();
  env.DB.raw.exec(`CREATE TRIGGER reject_outbox BEFORE INSERT ON hrr_application_outbox
    BEGIN SELECT RAISE(ABORT, 'forced outbox failure'); END`);
  await assert.rejects(submitHrrApplication(request(validApplication), env, null));
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM hrr_applications').get().n, 0);
});

test('retries the same Sheet row before emailing the organizer application details and Sheet link', async () => {
  const env = await setup();
  const privateKey = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'
  }, true, ['sign', 'verify']);
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey.privateKey));
  const pemBody = btoa(String.fromCharCode(...der));
  env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: 'worker@example.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${pemBody}\n-----END PRIVATE KEY-----` });
  env.HRR_APPLICATIONS_SHEET_ID = 'sheet-test-id';
  env.HRR_APPLICATION_NOTIFICATION_EMAIL = 'tsvetelin@pleggi.com';
  env.RESEND_API_KEY = 'test-key';
  env.EMAIL_FROM = 'test@example.com';
  const companyApplication = { ...validApplication, role: 'company', organization: '<Пример> ООД', university: '', specialty: '', position: 'HR мениджър' };
  await submitHrrApplication(request(companyApplication), env, null);

  const sheetWrites = [];
  const emailPayloads = [];
  let failFirstSheetWrite = true;
  globalThis.fetch = async (input, options = {}) => {
    const url = String(input);
    if (url.includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'test-token' });
    if (url.includes('/v4/spreadsheets/sheet-test-id?fields=')) return Response.json({ sheets: [{ properties: { sheetId: 42, title: 'Кандидатури', gridProperties: { rowCount: 1000 } } }] });
    if (url.includes('/values/')) {
      sheetWrites.push({ url, body: JSON.parse(options.body) });
      if (failFirstSheetWrite) { failFirstSheetWrite = false; return new Response('', { status: 503 }); }
      return Response.json({ updatedRows: 1 });
    }
    if (url.includes('api.resend.com/emails')) {
      emailPayloads.push(JSON.parse(options.body));
      return Response.json({ id: `email-${emailPayloads.length}` });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  console.error = () => {};

  await processHrrApplicationOutbox(env);
  const failed = env.DB.raw.prepare("SELECT status FROM hrr_application_outbox WHERE kind='sheet'").get();
  assert.equal(failed.status, 'pending');
  env.DB.raw.prepare("UPDATE hrr_application_outbox SET available_at=? WHERE status='pending'").run(new Date().toISOString());
  await processHrrApplicationOutbox(env);

  assert.equal(sheetWrites.length, 2);
  assert.equal(sheetWrites[0].url, sheetWrites[1].url);
  assert.equal(sheetWrites[0].body.values[0][0], 1);
  assert.equal(sheetWrites[0].body.values[0][10], 'candidate@example.com');
  assert.equal(decodeURIComponent(sheetWrites[0].url).includes(':N'), true);
  assert.equal(sheetWrites[0].body.values[0][13], 'HR мениджър');
  const organizerEmail = emailPayloads.find((email) => email.to[0] === 'tsvetelin@pleggi.com');
  assert.ok(organizerEmail);
  assert.match(organizerEmail.html, /candidate@example\.com/);
  assert.match(organizerEmail.html, /&lt;Пример&gt; ООД/);
  assert.match(organizerEmail.html, /HR мениджър/);
  assert.match(organizerEmail.html, /https:\/\/docs\.google\.com\/spreadsheets\/d\/sheet-test-id\/edit/);
  assert.equal(env.DB.raw.prepare("SELECT status FROM hrr_application_outbox WHERE kind='sheet'").get().status, 'sent');
});
