import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { after, test } from 'node:test';
import { handleHrr } from '../src/hrr.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'hrr-authz-test', use: 'sig', alg: 'RS256' };
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } });
after(() => { globalThis.fetch = originalFetch; });

function token(role) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'RS256', kid: jwk.kid });
  const payload = encode({ iss: 'https://issuer.test', exp: Math.floor(Date.now() / 1000) + 300, token_use: 'id', aud: 'test-client', sub: `user-${role}`, email: `${role}@example.test`, name: role });
  const content = `${header}.${payload}`;
  return `${content}.${sign('RSA-SHA256', Buffer.from(content), privateKey).toString('base64url')}`;
}

function envFor(role, queryResults = {}) {
  const user = { id: `user-${role}`, cognito_sub: `user-${role}`, email: `${role}@example.test`, display_name: role, role };
  return {
    HRR_COGNITO_ISSUER: 'https://issuer.test',
    HRR_COGNITO_CLIENT_ID: 'test-client',
    DB: {
      prepare(sql) {
        let params = [];
        return {
          bind(...values) { params = values; return this; },
          async first() {
            if (sql.includes('FROM hrr_seasons')) return { id: 'season-8' };
            if (sql.startsWith('SELECT role FROM hrr_mentor_allowlist')) return ['mentor', 'admin'].includes(role) ? { role } : null;
            if (sql.startsWith('SELECT * FROM hrr_users WHERE cognito_sub=? OR email=?')) return user;
            if (sql.startsWith('SELECT * FROM hrr_users WHERE cognito_sub=?')) return user;
            return null;
          },
          async run() { return { success: true, params }; },
          async all() { return { results: sql.includes('FROM hrr_missions m') ? queryResults.missions || [] : sql.includes('FROM hrr_submissions s') ? queryResults.history || [] : [] }; }
        };
      }
    }
  };
}

async function request(path, role, method = 'GET', env = envFor(role)) {
  return handleHrr(new Request(`https://local.test/api/hrr/${path}`, { method, headers: { authorization: `Bearer ${token(role)}`, 'content-type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {}) }), env, new URL(`https://local.test/api/hrr/${path}`));
}

test('student and mentor endpoints reject the other role', async () => {
  assert.equal((await request('mentor/notifications', 'student')).status, 403);
  assert.equal((await request('mentor/submissions', 'student')).status, 403);
  assert.equal((await request('mentor/missions', 'student', 'POST')).status, 403);
  assert.equal((await request('team', 'mentor')).status, 403);
  assert.equal((await request('notifications', 'mentor')).status, 403);
  assert.equal((await request('history', 'mentor')).status, 403);
  assert.equal((await request('mentor/notifications', 'mentor')).status, 200);
});

test('student mission feed exposes mentor contact for the detail panel', async () => {
  const expected = { id: 'mission-1', title: 'Подготви профил', description: 'Описание', deadline: '2026-10-01', points: 5, created_at: '2026-09-01T10:00:00.000Z', mentor_name: 'Ментор', mentor_email: 'mentor@example.test', my_status: 'approved' };
  const response = await request('missions', 'student', 'GET', envFor('student', { missions: [expected] }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).missions[0], expected);
});

test('student history includes mission metadata and the latest mentor feedback timestamps', async () => {
  const expected = { id: 'submission-1', mission_id: 'mission-1', status: 'approved', review_note: 'Добра работа', submitted_at: '2026-09-03T10:00:00.000Z', reviewed_at: '2026-09-04T10:00:00.000Z', title: 'Подготви профил', description: 'Описание', category: 'profile', points: 5, scope: 'team', deadline: '2026-10-01', mission_status: 'archived', published_at: '2026-09-01T10:00:00.000Z', mentor_name: 'Ментор', mentor_email: 'mentor@example.test' };
  const response = await request('history', 'student', 'GET', envFor('student', { history: [expected] }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.history[0].mission_id, expected.mission_id);
  assert.equal(body.history[0].mentor_email, expected.mentor_email);
  assert.equal(body.history[0].review_note, expected.review_note);
  assert.equal(body.history[0].submitted_at, expected.submitted_at);
  assert.equal(body.history[0].published_at, expected.published_at);
});
