// Company tables (Drive folder HRR_COMPANIES_FOLDER_ID): column „Трудност“ follows column „Сфера“,
// using the level of the matching position in HRR_POSITIONS_SHEET_ID („Информация за позициите“).
// Several positions in one cell → the hardest. No match → the cell is left as it is (can be picked by hand).
import { googleAccessToken } from './hrr-applications.js';

const RANK = { 'лесна': 1, 'средна': 2, 'трудна': 3 };
const ALIAS = { pleggi: 'плеги', kaufland: 'кауфланд', lidl: 'лидл', glovo: 'глово', holcim: 'холсим', fantastico: 'фантастико' };
const SKIP = new Set(['софия', 'пловд', 'варна', 'русе', 'бурга', 'перни', 'пълно', 'работ', 'време', 'опит', 'клиен', 'банка']);
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';

// ponytail: 5-letter stems so „отдел“/„отдели“, „служител“/„служители“ match; tune if it mislabels.
export const stems = (text) => [...new Set(String(text || '').toLowerCase().replace(/[^a-zа-я0-9]+/g, ' ').split(' ')
  .filter((w) => w.length >= 4).map((w) => w.slice(0, 5)).filter((w) => !SKIP.has(w)))];

export function companyKey(name) {
  const first = String(name || '').replace(/\(.*$/, '').toLowerCase().replace(/[^a-zа-я0-9]+/g, ' ').trim().split(' ')[0] || '';
  return ALIAS[first] || first;
}

// Rows of the positions tab (A company, only on its first row; B position; D level).
export function positionLevels(rows) {
  let company = '';
  const out = [];
  for (const row of rows.slice(1)) {
    if (String(row[0] || '').trim()) company = companyKey(row[0]);
    const level = String(row[3] || '').trim().toLowerCase();
    if (String(row[1] || '').trim() && RANK[level]) out.push({ company, words: stems(row[1]), level });
  }
  return out;
}

const bestLevel = (have, positions) => {
  let best = '';
  for (const p of positions) {
    if (!p.words.length) continue;
    const hits = p.words.filter((w) => have.includes(w)).length;
    // Either side mostly covered: „Касиер“ fits „Касиер - Технополис Мол Сердика“ and the long text fits the short title.
    if (hits && Math.max(hits / p.words.length, hits / have.length) >= 0.6 && (!best || RANK[p.level] > RANK[best])) best = p.level;
  }
  return best;
};

// Each listed position (split by , ; / or „1.“) is looked up in this company's positions first,
// then in all companies (a candidate may be sent for a role of another company). The hardest wins.
export function levelFor(text, company, positions) {
  const own = positions.filter((p) => p.company === company);
  let best = '';
  for (const part of String(text || '').split(/[,;/+\n]|\s\d+\.\s*|^\d+\.\s*/)) {
    const have = stems(part);
    if (!have.length) continue;
    const level = bestLevel(have, own) || bestLevel(have, positions);
    if (level && (!best || RANK[level] > RANK[best])) best = level;
  }
  return best;
}

// Cell updates for one company table: only where a level was found and differs from what is there.
export function difficultyUpdates(rows, company, positions, tab) {
  const head = (rows[0] || []).map((h) => String(h || '').trim().toLowerCase());
  const from = head.indexOf('сфера'), to = head.indexOf('трудност');
  if (from < 0 || to < 0) return [];
  const col = String.fromCharCode(65 + to);
  const updates = [];
  rows.slice(1).forEach((row, i) => {
    const level = levelFor(row[from], company, positions);
    const current = String(row[to] || '').trim().toLowerCase();
    // Never overwrite other text (e.g. a city picked by mistake in this column) — only empty or an old level.
    if (level && current !== level && (!current || RANK[current])) updates.push({ range: `'${tab}'!${col}${i + 2}`, values: [[level]] });
  });
  return updates;
}

export async function syncCompanyDifficulty(env) {
  if (!env.HRR_COMPANIES_FOLDER_ID || !env.HRR_POSITIONS_SHEET_ID) return { skipped: true };
  const token = await googleAccessToken(env, 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly');
  const get = async (url) => { const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error(`${r.status} ${url.split('?')[0]}`); return r.json(); };
  const positions = positionLevels((await get(`${SHEETS}/${env.HRR_POSITIONS_SHEET_ID}/values/${encodeURIComponent("'Позиции'!A1:D400")}`)).values || []);
  const q = encodeURIComponent(`'${env.HRR_COMPANIES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const files = (await get(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=100`)).files || [];
  let written = 0;
  for (const file of files) {
    try {
      const tab = (await get(`${SHEETS}/${file.id}?fields=sheets.properties.title`)).sheets?.[0]?.properties?.title;
      const rows = (await get(`${SHEETS}/${file.id}/values/${encodeURIComponent(`'${tab}'!A1:Z500`)}`)).values || [];
      const data = difficultyUpdates(rows, companyKey(file.name), positions, tab);
      if (!data.length) continue;
      const write = await fetch(`${SHEETS}/${file.id}/values:batchUpdate`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ valueInputOption: 'RAW', data }) });
      if (!write.ok) throw new Error(`write ${write.status}`);
      written += data.length;
    } catch (error) { console.warn('Difficulty sync failed for', file.name, error.message); }
  }
  return { ok: true, files: files.length, written };
}
