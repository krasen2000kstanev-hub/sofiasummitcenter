import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { after, test } from 'node:test';
import { handleHrr } from '../src/hrr.js';

// Real SQL against the real migrations: two students whose emails are NOT on the roster join with the same team code.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'join-test', use: 'sig', alg: 'RS256' };
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } });
after(() => { globalThis.fetch = originalFetch; });

const db = new DatabaseSync(':memory:');
for (const file of readdirSync(new URL('../migrations/', import.meta.url)).filter(name => name.includes('_hrr_')).sort()) {
  db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  // Seed migrations need a mentor to own missions; production has real admins already.
  if (file.startsWith('0011_')) db.exec("INSERT INTO hrr_users (id,cognito_sub,email,display_name,role,created_at,updated_at) VALUES ('admin','admin','admin@test','Admin','admin','now','now')");
}
const DB = { prepare(sql) { const stmt = db.prepare(sql); let params = []; return { bind(...values) { params = values; return this; }, async first() { return stmt.get(...params) ?? null; }, async all() { return { results: stmt.all(...params) }; }, async run() { stmt.run(...params); return { success: true }; } }; } };
const env = { DB, HRR_COGNITO_ISSUER: 'https://issuer.test', HRR_COGNITO_CLIENT_ID: 'test-client' };

const token = (sub, email) => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const content = `${encode({ alg: 'RS256', kid: jwk.kid })}.${encode({ iss: 'https://issuer.test', exp: Math.floor(Date.now() / 1000) + 300, token_use: 'id', aud: 'test-client', sub, email, name: sub })}`;
  return `${content}.${sign('RSA-SHA256', Buffer.from(content), privateKey).toString('base64url')}`;
};
const call = async (path, sub, email, method = 'GET', body) => {
  const url = `https://local.test/api/hrr/${path}`;
  const response = await handleHrr(new Request(url, { method, headers: { authorization: `Bearer ${token(sub, email)}`, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, new URL(url));
  return { status: response.status, body: await response.json() };
};

test('both team members can join with the same code when their emails are not on the roster', async () => {
  const season = db.prepare("SELECT id FROM hrr_seasons WHERE status='active'").get().id;
  const code = 'NBU-07-ABCD';
  db.prepare('INSERT INTO hrr_teams (id,season_id,name,university,city,join_code_hash,created_at) VALUES (?,?,?,?,?,?,?)').run('team-7', season, 'Екип 7', 'НБУ', '', createHash('sha256').update(code).digest('hex'), 'now');
  db.prepare('INSERT INTO hrr_team_roster (season_id,email,team_id) VALUES (?,?,?)').run(season, 'listed-a@uni.test', 'team-7');
  db.prepare('INSERT INTO hrr_team_roster (season_id,email,team_id) VALUES (?,?,?)').run(season, 'listed-b@uni.test', 'team-7');

  for (const [sub, email] of [['a', 'other-a@gmail.test'], ['b', 'other-b@gmail.test']]) {
    assert.equal((await call('me', sub, email)).status, 200);
    assert.equal((await call('team', sub, email)).body.team, null);
    const joined = await call('teams/join', sub, email, 'POST', { code: ' nbu-07-abcd ' });
    assert.equal(joined.status, 200, JSON.stringify(joined.body));
  }
  const team = await call('team', 'b', 'other-b@gmail.test');
  assert.equal(team.body.team.id, 'team-7');
  assert.equal(team.body.members.length, 2);
  assert.equal((await call('teams/join', 'c', 'third@gmail.test', 'POST', { code })).status, 409);
});

test('admin maps an unlisted email to a team and the student lands there', async () => {
  const season = db.prepare("SELECT id FROM hrr_seasons WHERE status='active'").get().id;
  db.prepare('INSERT INTO hrr_teams (id,season_id,name,university,city,join_code_hash,created_at) VALUES (?,?,?,?,?,?,?)').run('hrr_team_season-9_su_11', season, 'Екип 11', 'СУ', '', 'x', 'now');
  db.prepare("INSERT INTO hrr_mentor_allowlist (email,role,active,created_at) VALUES ('boss@test','admin',1,'now')").run();
  assert.equal((await call('me', 'g', 'george@gmail.test')).status, 200);
  assert.equal((await call('admin/roster', 'g', 'george@gmail.test', 'POST', { email: 'x@y.z', university: 'SU', team: 11 })).status, 403);
  const added = await call('admin/roster', 'boss', 'boss@test', 'POST', { email: ' George@gmail.test ', university: 'SU', team: '11' });
  assert.deepEqual([added.status, added.body.joined, added.body.members], [200, true, 1]);
  assert.equal((await call('team', 'g', 'george@gmail.test')).body.team.id, 'hrr_team_season-9_su_11');
  assert.equal((await call('admin/roster', 'boss', 'boss@test', 'POST', { email: 'a@b.c', university: 'SU', team: 99 })).status, 404);
});
