import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { handleHrr, refreshRanking } from '../src/hrr.js';

// The public ranking must come from the one-row snapshot the cron writes, not from the heavy aggregate query.
const db = new DatabaseSync(':memory:');
for (const file of readdirSync(new URL('../migrations/', import.meta.url)).filter(name => name.includes('_hrr_')).sort()) {
  db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  if (file.startsWith('0011_')) db.exec("INSERT INTO hrr_users (id,cognito_sub,email,display_name,role,created_at,updated_at) VALUES ('admin','admin','admin@test','Admin','admin','now','now')");
}
const queries = [];
const DB = { prepare(sql) { queries.push(sql); const stmt = db.prepare(sql); let params = []; return { bind(...values) { params = values; return this; }, async first() { return stmt.get(...params) ?? null; }, async all() { return { results: stmt.all(...params) }; }, async run() { stmt.run(...params); return { success: true }; } }; } };
const env = { DB };
const get = async () => { const url = 'https://local.test/api/hrr/ranking'; return (await handleHrr(new Request(url), env, new URL(url))).json(); };

test('ranking is served from the snapshot row and recomputed only by refresh', async () => {
  const teams = await refreshRanking(env);
  const snapshot = db.prepare('SELECT body FROM hrr_ranking_snapshot WHERE id=1').get();
  assert.deepEqual(JSON.parse(snapshot.body).teams, teams);

  queries.length = 0;
  const body = await get();
  assert.deepEqual(body.teams, teams);
  assert.ok(!queries.some(sql => sql.includes('hrr_submissions')), 'public read must not run the aggregate query');

  db.exec("UPDATE hrr_ranking_snapshot SET updated_at='2000-01-01T00:00:00.000Z', body='{\"stale\":true}'");
  await refreshRanking(env); // cron
  assert.ok(!('stale' in await get()));
});
