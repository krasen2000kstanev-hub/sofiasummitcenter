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

function envFor(role) {
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
            if (sql.startsWith('SELECT role FROM hrr_mentor_allowlist')) return ['mentor', 'admin'].includes(role) ? { role } : null;
            if (sql.startsWith('SELECT * FROM hrr_users WHERE cognito_sub=? OR email=?')) return user;
            if (sql.startsWith('SELECT * FROM hrr_users WHERE cognito_sub=?')) return user;
            return null;
          },
          async run() { return { success: true, params }; },
          async all() { return { results: [] }; }
        };
      }
    }
  };
}

async function request(path, role, method = 'GET') {
  return handleHrr(new Request(`https://local.test/api/hrr/${path}`, { method, headers: { authorization: `Bearer ${token(role)}`, 'content-type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {}) }), envFor(role), new URL(`https://local.test/api/hrr/${path}`));
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
