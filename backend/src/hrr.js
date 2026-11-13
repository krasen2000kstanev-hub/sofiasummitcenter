import { hrrUser, isStudentPreviewUser, isBlockedEmail, createSession, deleteSession, SESSION_PREFIX } from './hrr-auth.js';
import { googleAccessToken } from './hrr-applications.js';

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const now = () => new Date().toISOString();

async function hash(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function requireUser(request, env, roles = []) {
  try {
    const user = await hrrUser(request, env);
    if (!user) return { response: json({ error: 'Authentication required' }, 401) };
    if (roles.length && !roles.includes(user.role)) return { response: json({ error: 'Insufficient permissions' }, 403) };
    return { user };
  } catch (error) {
    return { response: json({ error: error.message || 'Invalid authentication' }, 401) };
  }
}

async function requireStudent(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth;
  if (auth.user.role !== 'student' && !(request.headers.get('x-hrr-view') === 'student' && isStudentPreviewUser(auth.user))) return { response: json({ error: 'Insufficient permissions' }, 403) };
  return auth;
}

async function currentSeason(env) {
  return env.DB.prepare("SELECT * FROM hrr_seasons WHERE status='active' ORDER BY id LIMIT 1").first();
}

const TEAM_LIMIT = 2;
// Mission dates are calendar days in Sofia; compare as YYYY-MM-DD strings.
export const sofiaToday = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia' }).format(date);
export const isSafeUrl = (value) => /^https?:\/\//i.test(String(value || ''));
// Up to 10 evidence links per submission, stored one per line in evidence_url.
export const parseEvidenceUrls = (value) => String(value || '').split(/\s+/).map((url) => url.trim()).filter(Boolean).slice(0, 10);

// Evidence document: PDF, Word, Excel, PowerPoint or TXT up to 4 MB (data URL ~5.6 MB), stored in ~1 MB parts.
const DOC_PATTERN = /^data:(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.[a-z.]+|application\/vnd\.ms-excel|application\/vnd\.ms-powerpoint|text\/plain);base64,[A-Za-z0-9+/=]+$/;
export const isEvidenceDocument = (doc) => Boolean(doc) && typeof doc.data === 'string' && doc.data.length <= 5_700_000 && DOC_PATTERN.test(doc.data) && Boolean(String(doc.name || '').trim());
const PART = 1_000_000;
async function deleteDocument(env, submissionId) {
  await env.DB.prepare('DELETE FROM hrr_submission_file_parts WHERE submission_id=?').bind(submissionId).run();
  await env.DB.prepare('DELETE FROM hrr_submission_files WHERE submission_id=?').bind(submissionId).run();
}
async function saveDocument(env, submissionId, doc) {
  await deleteDocument(env, submissionId);
  await env.DB.prepare('INSERT INTO hrr_submission_files (submission_id,name,mime,data,created_at) VALUES (?,?,?,?,?)')
    .bind(submissionId, clean(doc.name, 160), doc.data.slice(5, doc.data.indexOf(';')), '', now()).run();
  for (let part = 0; part * PART < doc.data.length; part += 1) await env.DB.prepare('INSERT INTO hrr_submission_file_parts (submission_id,part,data) VALUES (?,?,?)').bind(submissionId, part, doc.data.slice(part * PART, (part + 1) * PART)).run();
}
// Up to 5 photos per submission, one row each.
export const MAX_EVIDENCE_IMAGES = 5;
const IMAGE_ERROR = `Снимките трябва да са JPG, PNG или WEBP, до ${MAX_EVIDENCE_IMAGES} броя и до 1 MB всяка.`;
export const evidenceImages = (body) => (Array.isArray(body.evidenceImages) ? body.evidenceImages : (body.evidenceImage ? [body.evidenceImage] : [])).filter(Boolean);
export const evidenceImagesValid = (images) => images.length <= MAX_EVIDENCE_IMAGES && images.every((image) => isEvidenceImage(image));
async function saveImages(env, submissionId, images) {
  await env.DB.prepare('DELETE FROM hrr_submission_images WHERE submission_id=?').bind(submissionId).run();
  for (const [position, data] of images.entries()) await env.DB.prepare('INSERT INTO hrr_submission_images (submission_id,position,data) VALUES (?,?,?)').bind(submissionId, position, data).run();
}
const IMAGE_COUNT = '(SELECT COUNT(*) FROM hrr_submission_images i WHERE i.submission_id=s.id)';
const DOC_ERROR = 'Документът трябва да е PDF, Word, Excel, PowerPoint или TXT до 4 MB.';
const PLATFORM_URL = 'https://sofiasummit.bg/events/hr-rushforpractice/misii/';

// Email the students behind a submission; a failed email never blocks the review.
async function emailStudents(env, userIds, subject, text, replyTo) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !userIds.length) return;
  const rows = (await env.DB.prepare(`SELECT email FROM hrr_users WHERE id IN (${userIds.map(() => '?').join(',')})`).bind(...userIds).all()).results || [];
  for (const { email } of rows) {
    if (!String(email || '').includes('@')) continue;
    try {
      await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], ...(replyTo ? { reply_to: replyTo } : {}), subject, text }) });
    } catch (error) { console.warn('Feedback email failed', error); }
  }
}
export const reviewEmail = (title, status, note, points) => ({
  subject: status === 'approved' ? `HR:Rush — мисията „${title}“ е одобрена` : status === 'rejected' ? `HR:Rush — мисията „${title}“ е върната за корекция` : `HR:Rush — обратна връзка за „${title}“`,
  text: `Здравей!\n\n${status === 'approved' ? `Мисията „${title}“ е одобрена${points ? ` и получаваш ${points} т.` : ''}.` : status === 'rejected' ? `Мисията „${title}“ е върната за корекция.` : `Менторът остави обратна връзка за мисията „${title}“. Тя още чака проверка и можеш да промениш изпращането си.`}${note ? `\n\nОбратна връзка от ментора:\n${note}` : ''}\n\nМожеш да отговориш на ментора директно в платформата, в детайлите на мисията:\n${PLATFORM_URL}\n\nПоздрави,\nЕкипът на HR:Rush for Practice`
});
const evidenceUrlsError = (urls) => urls.some((url) => url.length > 1000 || !isSafeUrl(url)) ? 'Всеки линк трябва да започва с http:// или https://' : '';
// Photo evidence arrives as a browser-compressed data URL; ~1 MB keeps it well under the D1 row limit.
export const isEvidenceImage = (value) => typeof value === 'string' && value.length <= 1_400_000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
export const bonusPoints = (value) => { const n = Math.round(Number(value) || 0); return Math.min(1000, Math.max(0, n)); };
const missionKind = (value, fallback = 'regular') => ['regular', 'secret', 'bonus'].includes(value) ? value : fallback;
// Students never receive the real title/description of secret and bonus missions; they reveal a contact instead.
export const maskMission = (row) => (row.kind === 'secret' || row.kind === 'bonus') ? { ...row, title: row.kind === 'secret' ? 'Тайна мисия' : 'Бонус мисия', description: '', has_image: 0 } : row;
// ponytail: one roster sheet per season, gids hardcoded; move to a table if the sheets change often
const ROSTER_SHEETS = [['НБУ', 'NBU', '434191220'], ['УНСС', 'UNSS', '1743708126'], ['СУ', 'SU', '1017411608'], ['УЗФ', 'UZF', '530263534'], ['УниБИТ', 'UNIBIT', '1480888565']];
const normalizeCode = (value) => clean(value, 80).toUpperCase().replace(/\s+/g, '');

export function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// Main team block only: stops at the first row without a name or with a non-increasing team number.
export function parseRoster(rows) {
  const teams = []; let previous = 0;
  for (const row of rows.slice(1)) {
    const number = Number.parseInt(row[0], 10); const name = String(row[1] || '').trim();
    if (!name || !number || number <= previous) break;
    previous = number;
    const people = [[row[1], row[2]], [row[4], row[5]]].map(([who, email]) => [String(email || '').replace(/^mailto:/i, '').trim().toLowerCase(), String(who || '').trim()]).filter(([email]) => email.includes('@'));
    teams.push({ number, emails: people.map(([email]) => email), names: Object.fromEntries(people.filter(([, who]) => who && !who.includes('@'))) });
  }
  return teams;
}

function randomCode(length = 4) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return [...crypto.getRandomValues(new Uint8Array(length))].map((byte) => alphabet[byte % alphabet.length]).join('');
}

const activeMembers = async (env, teamId, seasonId, userId) => Number((await env.DB.prepare('SELECT COUNT(*) total FROM hrr_team_members WHERE team_id=? AND season_id=? AND active=1 AND user_id<>?').bind(teamId, seasonId, userId).first())?.total || 0);

async function addMember(env, season, teamId, userId) {
  await env.DB.prepare('UPDATE hrr_team_members SET active=0 WHERE user_id=? AND active=1').bind(userId).run();
  const previous = await env.DB.prepare('SELECT id FROM hrr_team_members WHERE team_id=? AND user_id=? LIMIT 1').bind(teamId, userId).first();
  if (previous) await env.DB.prepare('UPDATE hrr_team_members SET season_id=?,active=1,joined_at=? WHERE id=?').bind(season.id, now(), previous.id).run();
  else await env.DB.prepare('INSERT INTO hrr_team_members (id,season_id,team_id,user_id,active,joined_at) VALUES (?,?,?,?,1,?)').bind(id('hrr_member'), season.id, teamId, userId, now()).run();
}

async function alertAdmins(env, user, reason) {
  const title = reason === 'full' ? 'Отборът е пълен' : 'Вход с непознат имейл';
  const body = `${user.display_name} · ${user.email}${reason === 'full' ? ' е в списъка, но отборът му вече има 2 участници.' : ' не е в списъка с участници. Свържи се, за да го насочиш към отбора му.'}`;
  const admins = await env.DB.prepare("SELECT id FROM hrr_users WHERE role='admin'").all();
  for (const admin of admins.results || []) await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), admin.id, 'roster', title, body, now()).run();
  const to = String(env.HRR_ROSTER_ALERT_EMAIL || '').split(',').map((email) => email.trim()).filter(Boolean);
  if (!to.length || !env.RESEND_API_KEY || !env.EMAIL_FROM) return;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.EMAIL_FROM, to, subject: `HR:Rush · ${title}`, text: `${body}\n\nhttps://sofiasummit.bg/events/hr-rushforpractice/misii/?portal=mentor` }) });
  } catch (error) { console.warn('Roster alert email failed', error); }
}

// Students land in their team by the email they registered with; anyone else is flagged to the admins once per season.
async function autoJoin(env, user) {
  if (user.role !== 'student') return;
  const season = await currentSeason(env); if (!season) return;
  if (await env.DB.prepare('SELECT id FROM hrr_team_members WHERE user_id=? AND season_id=? AND active=1').bind(user.id, season.id).first()) return;
  const roster = await env.DB.prepare('SELECT team_id FROM hrr_team_roster WHERE season_id=? AND email=?').bind(season.id, String(user.email || '').toLowerCase()).first();
  if (roster && await activeMembers(env, roster.team_id, season.id, user.id) < TEAM_LIMIT) return addMember(env, season, roster.team_id, user.id);
  if (user.roster_alert_season === season.id) return;
  await env.DB.prepare('UPDATE hrr_users SET roster_alert_season=? WHERE id=?').bind(season.id, user.id).run();
  await alertAdmins(env, user, roster ? 'full' : 'unknown');
}

async function syncTeams(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const sheetId = (clean((await request.json()).sheet, 400).match(/[-\w]{25,}/) || [])[0];
  const result = await syncRoster(env, sheetId);
  return json(result, result.status || 200);
}

// Reads every university tab and writes only new or changed emails, so the 5-minute cron stays cheap on D1 writes.
export async function syncRoster(env, sheetId) {
  const season = await currentSeason(env);
  if (!season || !sheetId) return { error: 'Missing active season or teams sheet link', status: 400 };
  const known = new Map(((await env.DB.prepare('SELECT email,team_id FROM hrr_team_roster WHERE season_id=?').bind(season.id).all()).results || []).map((r) => [r.email, r.team_id]));
  // Students show up by the name in the sheet, not by their email; only changed names are written.
  const shown = new Map(((await env.DB.prepare("SELECT email,display_name FROM hrr_users WHERE role='student'").all()).results || []).map((r) => [String(r.email).toLowerCase(), r.display_name]));
  const created = []; let teams = 0, emails = 0, changed = 0;
  for (const [university, short, gid] of ROSTER_SHEETS) {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
    if (!response.ok) return { error: `Could not read sheet ${university}`, status: 502 };
    for (const row of parseRoster(parseCsv(await response.text()))) {
      const teamId = `hrr_team_${season.slug}_${short.toLowerCase()}_${row.number}`; teams += 1;
      if (!await env.DB.prepare('SELECT id FROM hrr_teams WHERE id=?').bind(teamId).first()) {
        const code = `${short}-${String(row.number).padStart(2, '0')}-${randomCode()}`;
        await env.DB.prepare('INSERT INTO hrr_teams (id,season_id,name,university,city,join_code_hash,created_at) VALUES (?,?,?,?,?,?,?)').bind(teamId, season.id, `Екип ${row.number}`, university, '', await hash(code), now()).run();
        created.push({ university, team: row.number, code });
      }
      for (const email of row.emails) {
        emails += 1;
        const name = row.names?.[email];
        if (name && shown.has(email) && shown.get(email) !== name) { await env.DB.prepare("UPDATE hrr_users SET display_name=? WHERE lower(email)=? AND role='student'").bind(name, email).run(); shown.set(email, name); }
        if (known.get(email) === teamId) continue;
        await env.DB.prepare('INSERT INTO hrr_team_roster (season_id,email,team_id) VALUES (?,?,?) ON CONFLICT(season_id,email) DO UPDATE SET team_id=excluded.team_id').bind(season.id, email, teamId).run();
        known.set(email, teamId); changed += 1;
      }
    }
  }
  return { ok: true, teams, emails, changed, created };
}

export const missionNumbers = (value) => [...new Set(String(value || '').split(/[\s,;]+/).map((n) => Number.parseInt(n, 10)).filter((n) => Number.isInteger(n) && n >= 0))];

// Organizer marks missions as done for a student (e.g. completed before they could log in). Creates approved submissions.
async function grantMissions(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const email = clean(body.email, 200).toLowerCase(); const numbers = missionNumbers(body.missions);
  if (!season || !email.includes('@') || !numbers.length) return json({ error: 'Нужни са имейл и номера на мисии (напр. 1, 2).' }, 400);
  const user = await env.DB.prepare("SELECT * FROM hrr_users WHERE email=? AND role='student'").bind(email).first();
  if (!user) return json({ error: 'Студентът още не е влизал с този имейл. Нека влезе веднъж и опитай пак.' }, 404);
  const teamId = await teamOf(env, user.id, season.id);
  if (!teamId) return json({ error: 'Студентът още не е в отбор. Първо го добави към екипа му.' }, 400);
  const granted = [], skipped = [], missing = [];
  for (const number of numbers) {
    const mission = await env.DB.prepare("SELECT * FROM hrr_missions WHERE season_id=? AND mission_number=? AND status='active' LIMIT 1").bind(season.id, number).first();
    if (!mission) { missing.push(number); continue; }
    const existing = await env.DB.prepare("SELECT id,status FROM hrr_submissions WHERE mission_id=? AND status IN ('pending','approved') AND (student_user_id=? OR (?='team' AND team_id=?)) LIMIT 1").bind(mission.id, user.id, mission.scope, teamId).first();
    if (existing?.status === 'approved') { skipped.push(`№${number}`); continue; }
    if (existing) await env.DB.prepare("UPDATE hrr_submissions SET status='approved',reviewer_user_id=?,review_note=?,reviewed_at=? WHERE id=?").bind(auth.user.id, 'Отбелязано от организатор', now(), existing.id).run();
    else await env.DB.prepare("INSERT INTO hrr_submissions (id,mission_id,team_id,student_user_id,evidence_text,status,reviewer_user_id,review_note,created_at,reviewed_at) VALUES (?,?,?,?,?,'approved',?,?,?,?)").bind(id('hrr_submission'), mission.id, teamId, user.id, 'Отбелязано ръчно от организатор', auth.user.id, 'Отбелязано от организатор', now(), now()).run();
    await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), user.id, 'approved', 'Мисията е одобрена', mission.title, now()).run();
    granted.push(`№${number} ${mission.title}`);
  }
  return json({ ok: true, granted, skipped, missing });
}

// Admin bonus: pick a team by university + number, then the whole team or one member by name.
async function teamLookup(request, env, url) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const code = url.searchParams.get('university'); const number = Number.parseInt(url.searchParams.get('team'), 10);
  const short = (ROSTER_SHEETS.find(([, c]) => c === code) || [])[1];
  if (!season || !short || !(number > 0)) return json({ error: 'Избери университет и номер на екип.' }, 400);
  const team = await env.DB.prepare('SELECT id,name,university FROM hrr_teams WHERE id=?').bind(`hrr_team_${season.slug}_${short.toLowerCase()}_${number}`).first();
  if (!team) return json({ error: 'Няма такъв екип в сезона.' }, 404);
  const members = ((await env.DB.prepare('SELECT u.id,u.display_name FROM hrr_team_members tm JOIN hrr_users u ON u.id=tm.user_id WHERE tm.team_id=? AND tm.season_id=? AND tm.active=1 ORDER BY u.display_name').bind(team.id, season.id).all()).results) || [];
  const awards = ((await env.DB.prepare('SELECT b.points,b.reason,b.created_at,b.kind,u.display_name FROM hrr_bonus_awards b LEFT JOIN hrr_users u ON u.id=b.user_id WHERE b.team_id=? ORDER BY b.created_at DESC LIMIT 10').bind(team.id).all()).results) || [];
  return json({ team, members, awards });
}

async function awardBonus(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const points = Math.round(Number(body.points)); const reason = clean(body.reason, 200); const teamId = clean(body.teamId, 120); const userId = clean(body.userId, 120); const kind = body.kind === 'mission' ? 'mission' : 'activity';
  const label = kind === 'mission' ? 'Точки от мисии' : 'Точки активност';
  if (!season || !Number.isFinite(points) || !points || Math.abs(points) > 1000) return json({ error: 'Въведи точки между -1000 и 1000 (без 0).' }, 400);
  if (!reason) return json({ error: 'Напиши причина за бонуса.' }, 400);
  const team = await env.DB.prepare('SELECT id,name,university FROM hrr_teams WHERE id=? AND season_id=?').bind(teamId, season.id).first();
  if (!team) return json({ error: 'Няма такъв екип в сезона.' }, 404);
  if (userId && !await env.DB.prepare('SELECT 1 FROM hrr_team_members WHERE team_id=? AND user_id=? AND season_id=? AND active=1').bind(team.id, userId, season.id).first()) return json({ error: 'Този човек не е в екипа.' }, 400);
  await env.DB.prepare('INSERT INTO hrr_bonus_awards (id,season_id,team_id,user_id,points,reason,created_by,created_at,kind) VALUES (?,?,?,?,?,?,?,?,?)').bind(id('hrr_bonus'), season.id, team.id, userId || null, points, reason, auth.user.id, now(), kind).run();
  const recipients = userId ? [userId] : (((await env.DB.prepare('SELECT user_id FROM hrr_team_members WHERE team_id=? AND season_id=? AND active=1').bind(team.id, season.id).all()).results) || []).map((r) => r.user_id);
  for (const recipient of recipients) await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), recipient, 'bonus', points > 0 ? `${label} +${points}` : `Корекция: ${label.toLowerCase()} ${points}`, reason, now()).run();
  return json({ ok: true, team: `${team.university} · ${team.name}`, points, kind });
}

// Manual fix for students who log in with an email that is not in the sheet: map that email to their team.
async function addRosterEmail(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const result = await assignRoster(env, season, body.email, body.university, body.team);
  return json(result, result.status || 200);
}

// Map an email to a season team and, if that student already signed in, put them in it (admin decision wins).
async function assignRoster(env, season, rawEmail, university, team) {
  const email = clean(rawEmail, 200).toLowerCase(); const short = (ROSTER_SHEETS.find(([, code]) => code === university) || [])[1]; const number = Number.parseInt(team, 10);
  if (!season || !email.includes('@') || !short || !number) return { error: 'Нужни са имейл, университет и номер на екип.', status: 400 };
  const teamId = `hrr_team_${season.slug}_${short.toLowerCase()}_${number}`;
  if (!await env.DB.prepare('SELECT id FROM hrr_teams WHERE id=?').bind(teamId).first()) return { error: 'Няма такъв екип в сезона.', status: 404 };
  await env.DB.prepare('INSERT INTO hrr_team_roster (season_id,email,team_id) VALUES (?,?,?) ON CONFLICT(season_id,email) DO UPDATE SET team_id=excluded.team_id').bind(season.id, email, teamId).run();
  const user = await env.DB.prepare("SELECT * FROM hrr_users WHERE email=? AND role='student'").bind(email).first();
  // Admin decision wins: move the student out of whatever team they joined (e.g. with a wrong code).
  const previous = user && await env.DB.prepare('SELECT t.id,t.name,t.university FROM hrr_team_members tm JOIN hrr_teams t ON t.id=tm.team_id WHERE tm.user_id=? AND tm.season_id=? AND tm.active=1').bind(user.id, season.id).first();
  const joined = Boolean(user) && previous?.id !== teamId && await activeMembers(env, teamId, season.id, user.id) < TEAM_LIMIT;
  if (joined) await addMember(env, season, teamId, user.id);
  return { ok: true, teamId, joined, already: previous?.id === teamId, previousTeam: previous && previous.id !== teamId ? `${previous.university} · ${previous.name}` : '', members: await activeMembers(env, teamId, season.id, '') };
}

export const ROSTER_UNIVERSITIES = ROSTER_SHEETS.map(([name, code]) => ({ name, code }));

// Student without a team says who they are; the matching roster alert reopens so the admin sees it.
async function submitRosterRequest(request, env) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const fullName = clean(body.fullName, 120); const university = ROSTER_UNIVERSITIES.find((u) => u.code === body.university)?.code; const number = Number.parseInt(body.team, 10);
  if (!season || fullName.length < 3 || !university || !(number > 0)) return json({ error: 'Попълни име и фамилия, университет и номер на екипа.' }, 400);
  const email = String(auth.user.email || '').toLowerCase();
  await env.DB.prepare("INSERT INTO hrr_roster_requests (season_id,user_id,id,email,full_name,university,team_number,status,created_at) VALUES (?,?,?,?,?,?,?,'pending',?) ON CONFLICT(season_id,user_id) DO UPDATE SET email=excluded.email,full_name=excluded.full_name,university=excluded.university,team_number=excluded.team_number,status='pending',created_at=excluded.created_at,resolved_at=NULL").bind(season.id, auth.user.id, id('hrr_request'), email, fullName, university, number, now()).run();
  await env.DB.prepare("UPDATE hrr_notifications SET resolved_at=NULL,read_at=NULL WHERE type='roster' AND body LIKE ?").bind(`% · ${email} %`).run();
  return json({ ok: true });
}

async function myRosterRequest(request, env) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env);
  const row = season && await env.DB.prepare('SELECT full_name,university,team_number,status,created_at FROM hrr_roster_requests WHERE season_id=? AND user_id=?').bind(season.id, auth.user.id).first();
  return json({ request: row || null, universities: ROSTER_UNIVERSITIES });
}

async function approveRosterRequest(request, env, requestId) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env);
  const row = await env.DB.prepare('SELECT * FROM hrr_roster_requests WHERE id=?').bind(requestId).first();
  if (!row) return json({ error: 'Заявката не е намерена.' }, 404);
  const result = await assignRoster(env, season, row.email, row.university, row.team_number);
  if (result.error) return json(result, result.status || 400);
  await env.DB.prepare("UPDATE hrr_roster_requests SET status='approved',resolved_at=? WHERE id=?").bind(now(), requestId).run();
  await env.DB.prepare("UPDATE hrr_users SET display_name=? WHERE id=? AND role='student'").bind(row.full_name, row.user_id).run();
  return json(result);
}


// The Drive owner's Apps Script posts the team folders it found and gets back who should edit each one.
// It shares as the owner, so team folders keep "editors can't share" on; the service account could not share them.
async function driveSync(request, env) {
  const owner = String(env.HRR_DRIVE_OWNER || '').toLowerCase();
  const token = String(request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!owner || !token) return json({ error: 'Forbidden' }, 403);
  const about = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', { headers: { authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  if (String(about.user?.emailAddress || '').toLowerCase() !== owner) return json({ error: 'Forbidden' }, 403);
  const season = await currentSeason(env); if (!season) return json({ teams: {}, missing: [] });
  const shorts = new Map(ROSTER_SHEETS.map(([university, short]) => [university, short.toLowerCase()]));
  const only = new Set(String(env.HRR_DRIVE_ONLY || '').split(',').map((s) => s.trim()).filter(Boolean));
  const found = new Map();
  for (const folder of (await request.json()).folders || []) {
    const number = Number((String(folder.name).match(/Екип\s*(\d+)/i) || [])[1]); const short = shorts.get(String(folder.university || '').trim());
    if (!number || !short) continue;
    const teamId = `hrr_team_${season.slug}_${short}_${number}`;
    if (!only.size || only.has(teamId)) found.set(teamId, String(folder.id));
  }
  const teams = (await env.DB.prepare('SELECT id,name,university,drive_folder_id FROM hrr_teams WHERE season_id=?').bind(season.id).all()).results || [];
  if (found.size) for (const team of teams) { const folder = found.get(team.id) || null; if (folder !== (team.drive_folder_id || null)) await env.DB.prepare('UPDATE hrr_teams SET drive_folder_id=? WHERE id=?').bind(folder, team.id).run(); }
  const result = Object.fromEntries([...found.values()].map((folder) => [folder, []]));
  const members = (await env.DB.prepare('SELECT tm.team_id,lower(u.email) email FROM hrr_team_members tm JOIN hrr_users u ON u.id=tm.user_id WHERE tm.season_id=? AND tm.active=1').bind(season.id).all()).results || [];
  for (const member of members) if (found.has(member.team_id) && member.email) result[found.get(member.team_id)].push(member.email);
  return json({ teams: result, missing: only.size ? [] : teams.filter((team) => !found.has(team.id)).map((team) => `${team.name} - ${team.university}`) });
}

async function me(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  await autoJoin(env, auth.user);
  const team = await env.DB.prepare('SELECT t.id,t.name,t.university,t.city,t.drive_folder_id FROM hrr_team_members tm JOIN hrr_teams t ON t.id=tm.team_id WHERE tm.user_id=? AND tm.active=1 ORDER BY tm.joined_at DESC LIMIT 1').bind(auth.user.id).first();
  return json({ user: auth.user, team, canPreview: isStudentPreviewUser(auth.user), driveRoot: auth.user.role === 'admin' ? env.HRR_DRIVE_ROOT_ID || null : null });
}

// The cron stores the computed ranking in one row; the public endpoint reads only that row (1 row read instead of ~1,100).
const RANKING_MAX_AGE_MS = 10 * 60 * 1000; // cron runs every 5 min; recompute on read only if it stalled
let rankingMemo = { at: 0, body: null }; // ponytail: per-isolate, saves even the 1-row read for 60s

export async function refreshRanking(env) {
  const season = await currentSeason(env);
  const teams = season ? ((await missionPointsByTeam(env, season)).results || []).map(row => ({ ...row, missionsPoints: Number(row.missions_points || 0), activityPoints: Number(row.activity_points || 0), missionsCompleted: Number(row.missions_completed || 0) })) : [];
  const body = JSON.stringify({ season: season?.slug || null, teams, updatedAt: now() });
  await env.DB.prepare('INSERT INTO hrr_ranking_snapshot (id,body,updated_at) VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at').bind(body, now()).run();
  rankingMemo = { at: Date.now(), body };
  return teams;
}

async function ranking(env) {
  if (!rankingMemo.body || Date.now() - rankingMemo.at > 60_000) {
    const row = await env.DB.prepare('SELECT body,updated_at FROM hrr_ranking_snapshot WHERE id=1').first();
    if (row && Date.now() - Date.parse(row.updated_at) < RANKING_MAX_AGE_MS) rankingMemo = { at: Date.now(), body: row.body };
    else await refreshRanking(env);
  }
  return new Response(rankingMemo.body, { headers: { 'content-type': 'application/json; charset=utf-8' } });
}

function missionPointsByTeam(env, season) {
  return env.DB.prepare(`SELECT t.id team_id,t.name team_name,t.university,t.city,
      COALESCE(SUM(CASE WHEN a.scope='team' THEN a.points ELSE a.points*a.completed_count END + a.bonus),0) + COALESCE((SELECT SUM(b.points) FROM hrr_bonus_awards b WHERE b.team_id=t.id AND b.kind='mission'),0) missions_points,
      COALESCE((SELECT SUM(b.points) FROM hrr_bonus_awards b WHERE b.team_id=t.id AND b.kind='activity'),0) activity_points,
      COALESCE(SUM(CASE WHEN a.scope='team' THEN 1 ELSE a.completed_count END),0) missions_completed
    FROM hrr_teams t
    LEFT JOIN (
      SELECT s.team_id,s.mission_id,m.scope,m.points,COUNT(*) completed_count,SUM(s.bonus_points) bonus
      FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
      WHERE s.status='approved' AND m.season_id=? AND s.team_id IN (SELECT id FROM hrr_teams WHERE season_id=?)
      GROUP BY s.team_id,s.mission_id,m.scope,m.points
    ) a ON a.team_id=t.id
    WHERE t.season_id=? GROUP BY t.id ORDER BY missions_points DESC,t.name ASC`).bind(season.id, season.id, season.id).all();
}

const RANKING_GID = 0; // „Обща класация на екипи“; found by gid so renaming the tab does not break the sync

// Rows of „Обща класация“ (A rank, B university, C team, E activity points, F mission points) → cell updates where E or F differs.
export function missionSheetUpdates(rows, pointsByTeam, tab, activityByTeam = new Map()) {
  const updates = [];
  rows.forEach((row, index) => {
    if (!/^\d+$/.test(String(row[0] || '').trim())) return;
    const key = `${String(row[1] || '').trim()}::${String(row[2] || '').trim()}`;
    const activity = activityByTeam.get(key), points = pointsByTeam.get(key);
    if (activity !== undefined && Number(row[4] || 0) !== activity) updates.push({ range: `'${tab}'!E${index + 1}`, values: [[activity]] });
    if (points !== undefined && Number(row[5] || 0) !== points) updates.push({ range: `'${tab}'!F${index + 1}`, values: [[points]] });
  });
  return updates;
}

// Activity points (organizer awards) → column E and approved mission points → column F of the season sheet, so the sheet total and the public ranking include them.
export async function syncMissionPointsToSheet(env, sheetId, teams) {
  if (!sheetId || !teams?.length) return { skipped: true };
  const pointsByTeam = new Map(teams.map((r) => [`${r.university}::${r.team_name}`, Number(r.missions_points || 0)]));
  const activityByTeam = new Map(teams.map((r) => [`${r.university}::${r.team_name}`, Number(r.activity_points || 0)]));
  const token = await googleAccessToken(env);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`;
  const meta = await fetch(`${base}?fields=sheets.properties(sheetId,title)`, { headers: { authorization: `Bearer ${token}` } });
  if (!meta.ok) return { error: `Could not read sheet tabs (${meta.status})` };
  const tab = ((await meta.json()).sheets || []).find((s) => s.properties?.sheetId === RANKING_GID)?.properties.title;
  if (!tab) return { error: 'Ranking tab (gid 0) not found' };
  const read = await fetch(`${base}/values/${encodeURIComponent(`'${tab}'!A1:F400`)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!read.ok) return { error: `Could not read ${tab} (${read.status})` };
  const data = missionSheetUpdates((await read.json()).values || [], pointsByTeam, tab, activityByTeam);
  if (!data.length) return { ok: true, updated: 0 };
  const write = await fetch(`${base}/values:batchUpdate`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }) });
  return write.ok ? { ok: true, updated: data.length } : { error: `Could not write ${tab} (${write.status})` };
}

async function joinTeam(request, env) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const body = await request.json(); const code = normalizeCode(body.code); const season = await currentSeason(env);
  if (!season || !code) return json({ error: 'Missing team code' }, 400);
  const team = await env.DB.prepare('SELECT * FROM hrr_teams WHERE season_id=? AND join_code_hash=?').bind(season.id, await hash(code)).first();
  if (!team) return json({ error: 'Invalid team code' }, 404);
  if (await activeMembers(env, team.id, season.id, auth.user.id) >= TEAM_LIMIT) return json({ error: 'Отборът вече е пълен. Свържи се с организаторите.' }, 409);
  await addMember(env, season, team.id, auth.user.id);
  return json({ ok: true, team });
}

async function team(request, env) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env);
  const membership = await env.DB.prepare('SELECT t.* FROM hrr_team_members tm JOIN hrr_teams t ON t.id=tm.team_id WHERE tm.user_id=? AND tm.season_id=? AND tm.active=1 LIMIT 1').bind(auth.user.id, season?.id || '').first();
  if (!membership) return json({ team: null, members: [] });
  const members = await env.DB.prepare(`SELECT u.id,u.display_name,COALESCE(SUM(CASE WHEN s.status='approved' AND m.scope='individual' THEN m.points + s.bonus_points ELSE 0 END),0) + COALESCE((SELECT SUM(b.points) FROM hrr_bonus_awards b WHERE b.user_id=u.id AND b.team_id=tm.team_id),0) points
    FROM hrr_team_members tm JOIN hrr_users u ON u.id=tm.user_id LEFT JOIN hrr_submissions s ON s.student_user_id=u.id LEFT JOIN hrr_missions m ON m.id=s.mission_id AND m.season_id=?
    WHERE tm.team_id=? AND tm.season_id=? AND tm.active=1 GROUP BY u.id ORDER BY points DESC`).bind(season.id, membership.id, season.id).all();
  const teamPoints = await env.DB.prepare(`SELECT COALESCE(SUM(points),0) points FROM (
    SELECT m.points + SUM(s.bonus_points) points FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
    WHERE s.team_id=? AND s.status='approved' AND m.scope='team' AND m.season_id=? GROUP BY s.mission_id,m.points
  ) approved_team_missions`).bind(membership.id, season.id).first();
  const teamBonus = await env.DB.prepare('SELECT COALESCE(SUM(points),0) points FROM hrr_bonus_awards WHERE team_id=? AND user_id IS NULL').bind(membership.id).first();
  return json({ team: membership, members: members.results || [], teamPoints: Number(teamPoints?.points || 0) + Number(teamBonus?.points || 0) });
}

// Team missions are shared: a submission by either member counts as the whole team's.
const teamOf = async (env, userId, seasonId) => (await env.DB.prepare('SELECT team_id FROM hrr_team_members WHERE user_id=? AND season_id=? AND active=1 LIMIT 1').bind(userId, seasonId).first())?.team_id || '';

async function missions(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env); if (!season) return json({ missions: [] });
  const studentView = auth.user.role === 'student' || (request.headers.get('x-hrr-view') === 'student' && isStudentPreviewUser(auth.user));
  const rows = !studentView && ['mentor', 'admin', 'viewer'].includes(auth.user.role)
    ? await env.DB.prepare(`SELECT m.id,m.season_id,m.mentor_user_id,m.mission_number,m.title,m.description,m.category,m.points,m.deadline,m.start_date,m.end_date,m.scope,m.status,m.created_at,m.kind,(m.image<>'') has_image,u.display_name mentor_name,u.email mentor_email,COUNT(s.id) submissions_pending FROM hrr_missions m LEFT JOIN hrr_users u ON u.id=m.mentor_user_id LEFT JOIN hrr_submissions s ON s.mission_id=m.id AND s.status='pending' WHERE m.season_id=? AND m.status='active' GROUP BY m.id ORDER BY m.created_at DESC`).bind(season.id).all()
    : await env.DB.prepare(`SELECT m.id,m.season_id,m.mentor_user_id,m.mission_number,m.title,m.description,m.category,m.points,m.deadline,m.start_date,m.end_date,m.scope,m.status,m.created_at,m.kind,(m.image<>'') has_image,u.display_name mentor_name,u.email mentor_email,COALESCE((SELECT status FROM hrr_submissions s WHERE s.mission_id=m.id AND (s.student_user_id=? OR (m.scope='team' AND s.team_id=?)) ORDER BY s.created_at DESC LIMIT 1),'not_started') my_status FROM hrr_missions m LEFT JOIN hrr_users u ON u.id=m.mentor_user_id WHERE m.season_id=? AND m.status='active' ORDER BY m.created_at DESC`).bind(auth.user.id, await teamOf(env, auth.user.id, season.id), season.id).all();
  return json({ missions: studentView ? (rows.results || []).map(maskMission) : rows.results || [] });
}

async function submit(request, env, missionId) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const mission = await env.DB.prepare("SELECT * FROM hrr_missions WHERE id=? AND status='active'").bind(missionId).first();
  // Only a team from the mission's own season counts, so old-season memberships cannot swallow points.
  const membership = mission && await env.DB.prepare('SELECT * FROM hrr_team_members WHERE user_id=? AND season_id=? AND active=1 LIMIT 1').bind(auth.user.id, mission.season_id).first();
  const body = await request.json(); const urls = parseEvidenceUrls(body.evidenceUrl); const evidenceUrl = urls.join('\n'); const images = evidenceImages(body);
  if (!evidenceImagesValid(images)) return json({ error: IMAGE_ERROR }, 400);
  const evidenceDocument = body.evidenceDocument || null;
  if (evidenceDocument && !isEvidenceDocument(evidenceDocument)) return json({ error: DOC_ERROR }, 400);
  if (!mission || !membership || (!evidenceUrl && !clean(body.evidenceText, 4000) && !images.length && !evidenceDocument)) return json({ error: 'Добави линк, описание, снимка или документ.' }, 400);
  if (evidenceUrlsError(urls)) return json({ error: evidenceUrlsError(urls) }, 400);
  const today = sofiaToday(), end = mission.end_date || mission.deadline;
  if (mission.start_date && mission.start_date > today) return json({ error: 'Мисията още не е започнала.' }, 400);
  if (end && end < today) return json({ error: 'Срокът на мисията е изтекъл.' }, 400);
  const existing = await env.DB.prepare("SELECT student_user_id FROM hrr_submissions WHERE mission_id=? AND status IN ('pending','approved') AND (student_user_id=? OR (?='team' AND team_id=?)) LIMIT 1").bind(missionId, auth.user.id, mission.scope, membership.team_id).first();
  if (existing) return json({ error: existing.student_user_id === auth.user.id ? 'Submission already exists' : 'Отборът ти вече е предал тази мисия.' }, 409);
  const submissionId = id('hrr_submission');
  await env.DB.prepare('INSERT INTO hrr_submissions (id,mission_id,team_id,student_user_id,evidence_url,evidence_text,evidence_image,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(submissionId, missionId, membership.team_id, auth.user.id, evidenceUrl, clean(body.evidenceText, 4000), '', 'pending', now()).run();
  if (images.length) await saveImages(env, submissionId, images);
  if (evidenceDocument) await saveDocument(env, submissionId, evidenceDocument);
  await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), mission.mentor_user_id, 'submission', 'Ново изпълнение на мисия', `${auth.user.display_name} изпрати доказателство за „${mission.title}“.`, now()).run();
  return json({ ok: true, submissionId }, 201);
}

// The author can fix a submission while it is still waiting for the mentor.
async function updateSubmission(request, env, submissionId) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const row = await env.DB.prepare('SELECT * FROM hrr_submissions WHERE id=?').bind(submissionId).first();
  if (!row || row.student_user_id !== auth.user.id) return json({ error: 'Изпращането не е намерено.' }, 404);
  if (row.status !== 'pending') return json({ error: 'Мисията вече е прегледана и не може да се променя.' }, 409);
  const body = await request.json(); const urls = parseEvidenceUrls(body.evidenceUrl); const evidenceUrl = urls.join('\n'); const evidenceText = clean(body.evidenceText, 4000);
  const images = evidenceImages(body);
  if (!evidenceImagesValid(images)) return json({ error: IMAGE_ERROR }, 400);
  const hasImage = images.length > 0 || (!body.removeImage && Boolean(await env.DB.prepare('SELECT 1 FROM hrr_submission_images WHERE submission_id=?').bind(submissionId).first()));
  if (evidenceUrlsError(urls)) return json({ error: evidenceUrlsError(urls) }, 400);
  if (body.evidenceDocument && !isEvidenceDocument(body.evidenceDocument)) return json({ error: DOC_ERROR }, 400);
  const hasDocument = body.evidenceDocument ? true : (!body.removeDocument && Boolean(await env.DB.prepare('SELECT 1 FROM hrr_submission_files WHERE submission_id=?').bind(submissionId).first()));
  if (!evidenceUrl && !evidenceText && !hasImage && !hasDocument) return json({ error: 'Добави линк, описание, снимка или документ.' }, 400);
  await env.DB.prepare('UPDATE hrr_submissions SET evidence_url=?,evidence_text=?,edited_at=? WHERE id=?').bind(evidenceUrl, evidenceText, now(), submissionId).run();
  if (images.length || body.removeImage) await saveImages(env, submissionId, images);
  if (body.evidenceDocument) await saveDocument(env, submissionId, body.evidenceDocument);
  else if (body.removeDocument) await deleteDocument(env, submissionId);
  const mission = await env.DB.prepare('SELECT title,mentor_user_id FROM hrr_missions WHERE id=?').bind(row.mission_id).first();
  if (mission?.mentor_user_id) await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), mission.mentor_user_id, 'submission_edit', 'Редактирано изпълнение', `${auth.user.display_name} промени доказателството за „${mission.title}“.`, now()).run();
  return json({ ok: true });
}


// Thread on a submission: mentor feedback and student replies, attached to list rows by submission id.
const COMMENT_COLUMNS = 'c.submission_id,c.author_role,c.body,c.created_at,u.display_name';
const groupComments = (rows) => (rows || []).reduce((map, c) => map.set(c.submission_id, [...(map.get(c.submission_id) || []), c]), new Map());
const addComment = (env, submissionId, userId, role, body) => env.DB.prepare('INSERT INTO hrr_submission_comments (id,submission_id,user_id,author_role,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_comment'), submissionId, userId, role, body, now()).run();

async function replyToMentor(request, env, submissionId) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const body = clean((await request.json()).body, 1000);
  if (!body) return json({ error: 'Напиши отговор.' }, 400);
  const row = await env.DB.prepare('SELECT s.student_user_id,s.team_id,m.scope,m.title,m.mentor_user_id,m.season_id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id WHERE s.id=?').bind(submissionId).first();
  const allowed = row && (row.student_user_id === auth.user.id || (row.scope === 'team' && (await teamOf(env, auth.user.id, row.season_id)) === row.team_id));
  if (!allowed) return json({ error: 'Изпращането не е намерено.' }, 404);
  await addComment(env, submissionId, auth.user.id, 'student', body);
  if (row.mentor_user_id) await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), row.mentor_user_id, 'reply', 'Отговор от студент', `${auth.user.display_name} за „${row.title}“: ${body}`, now()).run();
  return json({ ok: true });
}

async function mentorSubmissions(request, env) {
  const auth = await requireUser(request, env, ['mentor', 'admin', 'viewer']); if (auth.response) return auth.response;
  const rows = await env.DB.prepare(`SELECT s.id,s.edited_at,(SELECT name FROM hrr_submission_files f WHERE f.submission_id=s.id) document_name,s.mission_id,s.team_id,s.student_user_id,s.evidence_url,s.evidence_text,s.status,s.review_note,s.bonus_points,s.created_at,s.reviewed_at,${IMAGE_COUNT} has_image,m.title mission_title,m.points,t.name team_name,u.display_name student_name,u.email student_email
    FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id JOIN hrr_teams t ON t.id=s.team_id JOIN hrr_users u ON u.id=s.student_user_id
    WHERE (m.mentor_user_id=? OR ? IN ('admin','viewer')) ORDER BY CASE s.status WHEN 'pending' THEN 0 ELSE 1 END,s.created_at DESC`).bind(auth.user.id, auth.user.role).all();
  const comments = groupComments((await env.DB.prepare(`SELECT ${COMMENT_COLUMNS} FROM hrr_submission_comments c LEFT JOIN hrr_users u ON u.id=c.user_id JOIN hrr_submissions s ON s.id=c.submission_id JOIN hrr_missions m ON m.id=s.mission_id WHERE (m.mentor_user_id=? OR ? IN ('admin','viewer')) ORDER BY c.created_at`).bind(auth.user.id, auth.user.role).all()).results);
  return json({ submissions: (rows.results || []).map((row) => ({ ...row, comments: comments.get(row.id) || [] })) });
}

async function submissionDocument(request, env, submissionId) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const row = await env.DB.prepare('SELECT f.name,f.data,s.student_user_id,s.team_id,m.mentor_user_id,m.season_id FROM hrr_submission_files f JOIN hrr_submissions s ON s.id=f.submission_id JOIN hrr_missions m ON m.id=s.mission_id WHERE f.submission_id=?').bind(submissionId).first();
  const allowed = row && (['admin', 'viewer'].includes(auth.user.role) || row.mentor_user_id === auth.user.id || row.student_user_id === auth.user.id || (await teamOf(env, auth.user.id, row.season_id)) === row.team_id);
  if (!allowed) return json({ error: 'Document not found' }, 404);
  const parts = (await env.DB.prepare('SELECT data FROM hrr_submission_file_parts WHERE submission_id=? ORDER BY part').bind(submissionId).all()).results || [];
  return json({ name: row.name, data: row.data || parts.map((p) => p.data).join('') });
}

async function submissionImage(request, env, submissionId) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const position = Number.parseInt(new URL(request.url).searchParams.get('i') || '0', 10) || 0;
  const row = await env.DB.prepare('SELECT i.data evidence_image,s.student_user_id,s.team_id,m.mentor_user_id,m.season_id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id LEFT JOIN hrr_submission_images i ON i.submission_id=s.id AND i.position=? WHERE s.id=?').bind(position, submissionId).first();
  const allowed = row && (['admin', 'viewer'].includes(auth.user.role) || row.mentor_user_id === auth.user.id || row.student_user_id === auth.user.id || (await teamOf(env, auth.user.id, row.season_id)) === row.team_id);
  if (!row || !row.evidence_image || !allowed) return json({ error: 'Image not found' }, 404);
  return json({ image: row.evidence_image });
}

// Mentor comment on a pending submission without deciding it yet; the student is notified and sees it on the mission.
async function feedback(request, env, submissionId) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const note = clean((await request.json()).note, 1000);
  if (!note) return json({ error: 'Напиши обратна връзка.' }, 400);
  const submission = await env.DB.prepare('SELECT s.*,m.title,m.mentor_user_id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id WHERE s.id=?').bind(submissionId).first();
  if (!submission || (auth.user.role !== 'admin' && submission.mentor_user_id !== auth.user.id)) return json({ error: 'Submission not found' }, 404);
  if (submission.status !== 'pending') return json({ error: 'Submission already reviewed' }, 409);
  await env.DB.prepare('UPDATE hrr_submissions SET review_note=?,reviewer_user_id=? WHERE id=?').bind(note, auth.user.id, submissionId).run();
  await addComment(env, submissionId, auth.user.id, 'mentor', note);
  await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), submission.student_user_id, 'feedback', 'Обратна връзка от ментора', `${submission.title} — ${note}`, now()).run();
  const mail = reviewEmail(submission.title, 'feedback', note, 0);
  await emailStudents(env, [submission.student_user_id], mail.subject, mail.text, auth.user.email);
  return json({ ok: true });
}

async function review(request, env, submissionId) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const body = await request.json(); const status = clean(body.status, 20); const note = clean(body.note, 1000); const bonus = status === 'approved' ? bonusPoints(body.bonusPoints) : 0;
  if (!['approved', 'rejected'].includes(status)) return json({ error: 'Invalid review status' }, 400);
  const submission = await env.DB.prepare(`SELECT s.*,m.title,m.points,m.scope,m.mentor_user_id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id WHERE s.id=?`).bind(submissionId).first();
  if (!submission || (auth.user.role !== 'admin' && submission.mentor_user_id !== auth.user.id)) return json({ error: 'Submission not found' }, 404);
  if (submission.status !== 'pending') return json({ error: 'Submission already reviewed' }, 409);
  await env.DB.prepare('UPDATE hrr_submissions SET status=?,reviewer_user_id=?,review_note=?,bonus_points=?,reviewed_at=? WHERE id=? AND status=\'pending\'').bind(status, auth.user.id, note, bonus, now(), submissionId).run();
  if (note) await addComment(env, submissionId, auth.user.id, 'mentor', note);
  const recipients = submission.scope === 'team'
    ? ((await env.DB.prepare('SELECT user_id FROM hrr_team_members WHERE team_id=? AND active=1').bind(submission.team_id).all()).results || []).map((row) => row.user_id)
    : [submission.student_user_id];
  for (const userId of new Set([submission.student_user_id, ...recipients])) await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), userId, status, status === 'approved' ? 'Мисията е одобрена' : 'Мисията е отхвърлена', `${submission.title}${bonus ? ` · +${bonus} бонус точки` : ''}${note ? ` — ${note}` : ''}`, now()).run();
  const mail = reviewEmail(submission.title, status, note, status === 'approved' ? Number(submission.points || 0) + bonus : 0);
  await emailStudents(env, [...new Set([submission.student_user_id, ...recipients])], mail.subject, mail.text, auth.user.email);
  return json({ ok: true, status, bonusPoints: bonus });
}

async function markNotificationsRead(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  await env.DB.prepare('UPDATE hrr_notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').bind(now(), auth.user.id).run();
  return json({ ok: true });
}

// Roster alert bodies read "<name> · <email> не е в списъка…"; the email decides whether the alert is still open.
export const rosterAlertEmail = (body) => (String(body || '').split(' · ')[1] || '').trim().split(/\s/)[0].toLowerCase();

// Tick off a roster alert by hand; every admin got the same alert text, so all copies are resolved together.
async function resolveNotification(request, env, noteId) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const note = await env.DB.prepare("SELECT body FROM hrr_notifications WHERE id=? AND user_id=? AND type='roster'").bind(noteId, auth.user.id).first();
  if (!note) return json({ error: 'Notification not found' }, 404);
  await env.DB.prepare("UPDATE hrr_notifications SET resolved_at=?,read_at=COALESCE(read_at,?) WHERE type='roster' AND body=?").bind(now(), now(), note.body).run();
  return json({ ok: true });
}

export const rosterContactEmail = (email) => ({
  subject: 'HR:Rush for Practice — нужни са ни твоите данни',
  text: `Здравей!\n\nОпита се да влезеш в платформата на HR:Rush for Practice с имейл ${email}, но той не е в списъка с участници.\n\nЗа да те свържем с отбора ти, влез отново с този имейл тук:\nhttps://sofiasummit.bg/events/hr-rushforpractice/misii/\n\nи попълни краткия формуляр:\n1. Име и фамилия\n2. Университет\n3. Номер на екипа\n\nЩом го получим, ще те добавим и ще можеш да влизаш с този имейл. Ако не можеш да влезеш, просто отговори на този имейл със същите данни.\n\nПоздрави,\nЕкипът на HR:Rush for Practice`
});

// Admin emails the person behind a roster alert; replies go to that admin. All admin copies of the alert are marked.
async function contactRosterEmail(request, env, noteId) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const note = await env.DB.prepare("SELECT body FROM hrr_notifications WHERE id=? AND user_id=? AND type='roster'").bind(noteId, auth.user.id).first();
  const email = note && rosterAlertEmail(note.body);
  if (!email || !email.includes('@')) return json({ error: 'Notification not found' }, 404);
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return json({ error: 'Имейл услугата не е настроена.' }, 503);
  const message = rosterContactEmail(email);
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], reply_to: auth.user.email, subject: message.subject, text: message.text }) });
  if (!response.ok) return json({ error: `Имейлът не беше изпратен (${response.status}).` }, 502);
  await env.DB.prepare("UPDATE hrr_notifications SET contacted_at=? WHERE type='roster' AND body=?").bind(now(), note.body).run();
  return json({ ok: true, email });
}

async function notifications(request, env, roles = ['student']) {
  const auth = roles.length === 1 && roles[0] === 'student' ? await requireStudent(request, env) : await requireUser(request, env, roles); if (auth.response) return auth.response;
  const rows = await env.DB.prepare('SELECT * FROM hrr_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(auth.user.id).all();
  const list = rows.results || []; const season = await currentSeason(env);
  // An alert is resolved once the organizer gave that email a team (roster or membership), made it staff, or blocked it.
  if (season && list.some((n) => n.type === 'roster')) {
    const roster = new Set(((await env.DB.prepare('SELECT email FROM hrr_team_roster WHERE season_id=?').bind(season.id).all()).results || []).map((r) => String(r.email).toLowerCase()));
    const placed = new Set(((await env.DB.prepare("SELECT u.email FROM hrr_users u WHERE u.role IN ('admin','mentor') OR u.id IN (SELECT user_id FROM hrr_team_members WHERE season_id=? AND active=1) UNION SELECT email FROM hrr_mentor_allowlist WHERE active=1").bind(season.id).all()).results || []).map((r) => String(r.email).toLowerCase()));
    const requests = new Map(((await env.DB.prepare("SELECT id,email,full_name,university,team_number,created_at FROM hrr_roster_requests WHERE season_id=? AND status='pending'").bind(season.id).all()).results || []).map((r) => [String(r.email).toLowerCase(), r]));
    for (const n of list) {
      if (n.type !== 'roster') continue;
      const email = rosterAlertEmail(n.body);
      n.request = requests.get(email) || null;
      n.resolved = Boolean(n.resolved_at) || (Boolean(email) && (placed.has(email) || (n.title !== 'Отборът е пълен' && roster.has(email)) || isBlockedEmail(env, email)));
    }
  }
  return json({ notifications: list });
}

async function history(request, env) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env); if (!season) return json({ history: [], approvedPoints: 0 });
  const rows = await env.DB.prepare(`SELECT s.id,s.id submission_id,s.edited_at,(SELECT name FROM hrr_submission_files f WHERE f.submission_id=s.id) document_name,s.student_user_id,s.evidence_url,s.evidence_text,${IMAGE_COUNT} has_evidence_image,s.mission_id,s.status,s.review_note,s.created_at submitted_at,s.reviewed_at,
      m.mission_number,m.kind,m.title,m.description,m.category,m.points + s.bonus_points points,s.bonus_points,m.scope,m.deadline,m.start_date,m.end_date,m.status mission_status,m.created_at published_at,
      u.display_name mentor_name,u.email mentor_email
    FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
    LEFT JOIN hrr_users u ON u.id=m.mentor_user_id
    WHERE (s.student_user_id=? OR (m.scope='team' AND s.team_id=?)) AND m.season_id=? ORDER BY COALESCE(s.reviewed_at,s.created_at) DESC LIMIT 100`).bind(auth.user.id, await teamOf(env, auth.user.id, season.id), season.id).all();
  const myTeam = await teamOf(env, auth.user.id, season.id);
  const bonuses = ((await env.DB.prepare('SELECT points,reason,created_at,user_id,kind FROM hrr_bonus_awards WHERE season_id=? AND (user_id=? OR (user_id IS NULL AND team_id=?)) ORDER BY created_at DESC').bind(season.id, auth.user.id, myTeam).all()).results || []);
  const points = (rows.results || []).filter((row) => row.status === 'approved').reduce((total, row) => total + Number(row.points || 0), 0) + bonuses.reduce((total, row) => total + Number(row.points || 0), 0);
  const comments = groupComments((await env.DB.prepare(`SELECT ${COMMENT_COLUMNS} FROM hrr_submission_comments c LEFT JOIN hrr_users u ON u.id=c.user_id WHERE c.submission_id IN (SELECT s.id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id WHERE (s.student_user_id=? OR (m.scope='team' AND s.team_id=?)) AND m.season_id=?) ORDER BY c.created_at`).bind(auth.user.id, myTeam, season.id).all()).results);
  return json({ history: (rows.results || []).map(maskMission).map((row) => ({ ...row, comments: comments.get(row.id) || [] })), bonuses, approvedPoints: points });
}

async function createMission(request, env) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const startDate = clean(body.startDate, 20); const endDate = clean(body.endDate, 20);
  const missionNumber = Number(body.missionNumber);
  if (!season || !Number.isInteger(missionNumber) || missionNumber < 0 || !clean(body.title, 160) || !Number.isFinite(Number(body.points)) || (startDate && endDate && startDate > endDate)) return json({ error: 'Mission number, title, points and a valid date range are required' }, 400);
  if (body.image && !isEvidenceImage(body.image)) return json({ error: 'Снимката трябва да е JPG, PNG или WEBP до 1 MB.' }, 400);
  const missionId = id('hrr_mission');
  await env.DB.prepare('INSERT INTO hrr_missions (id,season_id,mentor_user_id,mission_number,title,description,category,points,deadline,start_date,end_date,scope,status,created_at,kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(missionId, season.id, auth.user.id, missionNumber, clean(body.title, 160), clean(body.description, 4000), 'general', Math.max(0, Number(body.points)), endDate, startDate, endDate, ['individual','team'].includes(body.scope) ? body.scope : 'team', 'active', now(), missionKind(body.kind)).run();
  if (body.image) await env.DB.prepare('UPDATE hrr_missions SET image=? WHERE id=?').bind(body.image, missionId).run();
  return json({ ok: true, missionId }, 201);
}

async function updateMission(request, env, missionId) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const mission = await env.DB.prepare('SELECT * FROM hrr_missions WHERE id=?').bind(missionId).first();
  if (!mission || (auth.user.role !== 'admin' && mission.mentor_user_id !== auth.user.id)) return json({ error: 'Mission not found' }, 404);
  const body = await request.json(); const startDate = clean(body.startDate, 20); const endDate = clean(body.endDate, 20); const missionNumber = Number(body.missionNumber ?? mission.mission_number);
  if (!Number.isInteger(missionNumber) || missionNumber < 0 || !clean(body.title, 160) || !Number.isFinite(Number(body.points)) || (startDate && endDate && startDate > endDate)) return json({ error: 'Mission number, title, points and a valid date range are required' }, 400);
  if (body.image && !isEvidenceImage(body.image)) return json({ error: 'Снимката трябва да е JPG, PNG или WEBP до 1 MB.' }, 400);
  let mentorUserId = mission.mentor_user_id;
  if (auth.user.role === 'admin' && body.mentorUserId) {
    const mentor = await env.DB.prepare("SELECT id FROM hrr_users WHERE id=? AND role IN ('mentor','admin')").bind(clean(body.mentorUserId, 100)).first();
    if (!mentor) return json({ error: 'Invalid mission mentor' }, 400);
    mentorUserId = mentor.id;
  }
  await env.DB.prepare('UPDATE hrr_missions SET mentor_user_id=?,mission_number=?,title=?,description=?,points=?,deadline=?,start_date=?,end_date=?,scope=?,kind=? WHERE id=?').bind(mentorUserId, missionNumber, clean(body.title, 160), clean(body.description, 4000), Math.max(0, Number(body.points)), endDate, startDate, endDate, ['individual','team'].includes(body.scope) ? body.scope : mission.scope || 'team', missionKind(body.kind, mission.kind || 'regular'), missionId).run();
  if (body.image || body.removeImage) await env.DB.prepare('UPDATE hrr_missions SET image=? WHERE id=?').bind(body.image || '', missionId).run();
  return json({ ok: true, missionId });
}

// Mission picture on demand, so the mission list stays small; hidden missions keep their picture hidden from students.
async function missionImage(request, env, missionId) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const row = await env.DB.prepare('SELECT image,kind FROM hrr_missions WHERE id=?').bind(missionId).first();
  const studentView = auth.user.role === 'student' || request.headers.get('x-hrr-view') === 'student';
  if (!row || !row.image || (studentView && (row.kind === 'secret' || row.kind === 'bonus'))) return json({ error: 'Image not found' }, 404);
  return json({ image: row.image });
}

async function archiveMission(request, env, missionId) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const result = await env.DB.prepare("UPDATE hrr_missions SET status='archived' WHERE id=? AND status<>'archived'").bind(missionId).run();
  return result?.meta?.changes === 0 ? json({ error: 'Mission not found' }, 404) : json({ ok: true, missionId });
}

async function mentorDirectory(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const rows = await env.DB.prepare("SELECT id,display_name,email,role FROM hrr_users WHERE role IN ('mentor','admin') ORDER BY display_name").all();
  return json({ mentors: rows.results || [] });
}

async function createTeam(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json(); const code = normalizeCode(body.joinCode);
  if (!season || !clean(body.name, 120) || !clean(body.university, 160) || !code) return json({ error: 'Name, university and join code are required' }, 400);
  const teamId = id('hrr_team');
  await env.DB.prepare('INSERT INTO hrr_teams (id,season_id,name,university,city,join_code_hash,created_at) VALUES (?,?,?,?,?,?,?)').bind(teamId, season.id, clean(body.name, 120), clean(body.university, 160), clean(body.city, 80), await hash(code), now()).run();
  return json({ ok: true, teamId, joinCode: code }, 201);
}

async function addMentor(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const body = await request.json(); const email = clean(body.email, 240).toLowerCase(); const role = ['admin', 'viewer'].includes(body.role) ? body.role : 'mentor';
  if (!email || !email.includes('@')) return json({ error: 'Valid email is required' }, 400);
  await env.DB.prepare('INSERT INTO hrr_mentor_allowlist (email,role,active,created_at) VALUES (?,?,1,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role,active=1').bind(email, role, now()).run();
  return json({ ok: true, email, role }, 201);
}

export async function handleHrr(request, env, url) {
  if (!url.pathname.startsWith('/api/hrr/')) return null;
  if (request.method === 'GET' && url.pathname === '/api/hrr/ranking') return ranking(env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/drive/sync') return driveSync(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/auth/token') {
    const body = await request.json();
    const tokenUrl = `${String(env.HRR_COGNITO_DOMAIN || '').replace(/\/$/, '')}/oauth2/token`;
    if (!env.HRR_COGNITO_DOMAIN || !env.HRR_COGNITO_CLIENT_ID || !tokenUrl.startsWith('https://') || !body.code || !body.codeVerifier) return json({ error: 'Cognito configuration is incomplete' }, 503);
    const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: env.HRR_COGNITO_CLIENT_ID, code: body.code, redirect_uri: clean(body.redirectUri, 500), code_verifier: body.codeVerifier });
    const response = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form });
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  if (request.method === 'GET' && url.pathname === '/api/hrr/me') return me(request, env);
  // Swap a 1-hour Google sign-in for a remembered 60-day session; logging out deletes it.
  if (request.method === 'POST' && url.pathname === '/api/hrr/auth/session') {
    if (String(request.headers.get('Authorization') || '').slice(7).startsWith(SESSION_PREFIX)) return json({ error: 'Влез с Google.' }, 400);
    const auth = await requireUser(request, env); if (auth.response) return auth.response;
    return json({ token: await createSession(env, auth.user) });
  }
  if (request.method === 'POST' && url.pathname === '/api/hrr/auth/logout') { await deleteSession(env, String(request.headers.get('Authorization') || '').slice(7)); return json({ ok: true }); }
  if (request.method === 'POST' && url.pathname === '/api/hrr/teams/join') return joinTeam(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/team') return team(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/missions') return missions(request, env);
  if (request.method === 'GET' && /^\/api\/hrr\/missions\/[^/]+\/image$/.test(url.pathname)) return missionImage(request, env, url.pathname.split('/')[4]);
  if (request.method === 'POST' && /^\/api\/hrr\/missions\/[^/]+\/submissions$/.test(url.pathname)) return submit(request, env, url.pathname.split('/')[4]);
  if (request.method === 'GET' && url.pathname === '/api/hrr/mentor/submissions') return mentorSubmissions(request, env);
  if (request.method === 'POST' && /^\/api\/hrr\/submissions\/[^/]+\/comments$/.test(url.pathname)) return replyToMentor(request, env, url.pathname.split('/')[4]);
  if (request.method === 'PATCH' && /^\/api\/hrr\/submissions\/[^/]+$/.test(url.pathname)) return updateSubmission(request, env, url.pathname.split('/').at(-1));
  if (request.method === 'GET' && /^\/api\/hrr\/mentor\/submissions\/[^/]+\/image$/.test(url.pathname)) return submissionImage(request, env, url.pathname.split('/')[5]);
  if (request.method === 'GET' && /^\/api\/hrr\/mentor\/submissions\/[^/]+\/document$/.test(url.pathname)) return submissionDocument(request, env, url.pathname.split('/')[5]);
  if (request.method === 'POST' && /^\/api\/hrr\/mentor\/submissions\/[^/]+\/review$/.test(url.pathname)) return review(request, env, url.pathname.split('/')[5]);
  if (request.method === 'POST' && /^\/api\/hrr\/mentor\/submissions\/[^/]+\/feedback$/.test(url.pathname)) return feedback(request, env, url.pathname.split('/')[5]);
  if (request.method === 'GET' && url.pathname === '/api/hrr/notifications') return notifications(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/notifications/read') return markNotificationsRead(request, env);
  if (request.method === 'POST' && /^\/api\/hrr\/notifications\/[^/]+\/resolve$/.test(url.pathname)) return resolveNotification(request, env, url.pathname.split('/')[4]);
  if (request.method === 'POST' && /^\/api\/hrr\/notifications\/[^/]+\/contact$/.test(url.pathname)) return contactRosterEmail(request, env, url.pathname.split('/')[4]);
  if (request.method === 'GET' && url.pathname === '/api/hrr/mentor/notifications') return notifications(request, env, ['mentor', 'admin', 'viewer']);
  if (request.method === 'GET' && url.pathname === '/api/hrr/history') return history(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/mentor/missions') return createMission(request, env);
  if (request.method === 'PATCH' && /^\/api\/hrr\/mentor\/missions\/[^/]+$/.test(url.pathname)) return updateMission(request, env, url.pathname.split('/').at(-1));
  if (request.method === 'DELETE' && /^\/api\/hrr\/mentor\/missions\/[^/]+$/.test(url.pathname)) return archiveMission(request, env, url.pathname.split('/').at(-1));
  if (request.method === 'GET' && url.pathname === '/api/hrr/admin/mentors') return mentorDirectory(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/teams') return createTeam(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/roster') return addRosterEmail(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/admin/team-lookup') return teamLookup(request, env, url);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/bonus') return awardBonus(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/roster-request') return submitRosterRequest(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/roster-request') return myRosterRequest(request, env);
  if (request.method === 'POST' && /^\/api\/hrr\/admin\/roster-requests\/[^/]+\/approve$/.test(url.pathname)) return approveRosterRequest(request, env, url.pathname.split('/')[5]);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/missions/grant') return grantMissions(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/teams/sync') return syncTeams(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/allowlist') return addMentor(request, env);
  return json({ error: 'Not found' }, 404);
}
