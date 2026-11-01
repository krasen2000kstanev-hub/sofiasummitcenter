import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { cors } from '../src/cors.js';

test('preflight allows every custom header the student portal sends', () => {
  const portal = readFileSync(new URL('../../events/hr-rushforpractice/misii/index.html', import.meta.url), 'utf8');
  const sent = [...portal.matchAll(/'(x-[a-z-]+)':/g)].map(match => match[1]);
  assert.ok(sent.includes('x-hrr-view'));
  const allowed = cors(new Request('https://local.test/api/hrr/team', { method: 'OPTIONS', headers: { Origin: 'https://sofiasummit.bg' } }))['access-control-allow-headers'].split(',');
  for (const header of sent) assert.ok(allowed.includes(header), `${header} is blocked by CORS`);
});
