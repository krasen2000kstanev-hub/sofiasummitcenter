import { hrrUser, isStudentPreviewUser } from './hrr-auth.js';

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
const missionKind = (value, fallback = 'regular') => ['regular', 'secret', 'bonus'].includes(value) ? value : fallback;
// Students never receive the real title/description of secret and bonus missions; they reveal a contact instead.
export const maskMission = (row) => (row.kind === 'secret' || row.kind === 'bonus') ? { ...row, title: row.kind === 'secret' ? 'Тайна мисия' : 'Бонус мисия', description: '' } : row;
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
    const emails = [row[2], row[5]].map((email) => String(email || '').replace(/^mailto:/i, '').trim().toLowerCase()).filter((email) => email.includes('@'));
    teams.push({ number, emails });
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
  const season = await currentSeason(env); const sheetId = (clean((await request.json()).sheet, 400).match(/[-\w]{25,}/) || [])[0];
  if (!season || !sheetId) return json({ error: 'Missing active season or teams sheet link' }, 400);
  const created = []; let teams = 0, emails = 0;
  for (const [university, short, gid] of ROSTER_SHEETS) {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
    if (!response.ok) return json({ error: `Could not read sheet ${university}` }, 502);
    for (const row of parseRoster(parseCsv(await response.text()))) {
      const teamId = `hrr_team_${season.slug}_${short.toLowerCase()}_${row.number}`; teams += 1;
      if (!await env.DB.prepare('SELECT id FROM hrr_teams WHERE id=?').bind(teamId).first()) {
        const code = `${short}-${String(row.number).padStart(2, '0')}-${randomCode()}`;
        await env.DB.prepare('INSERT INTO hrr_teams (id,season_id,name,university,city,join_code_hash,created_at) VALUES (?,?,?,?,?,?,?)').bind(teamId, season.id, `Екип ${row.number}`, university, '', await hash(code), now()).run();
        created.push({ university, team: row.number, code });
      }
      for (const email of row.emails) {
        await env.DB.prepare('INSERT INTO hrr_team_roster (season_id,email,team_id) VALUES (?,?,?) ON CONFLICT(season_id,email) DO UPDATE SET team_id=excluded.team_id').bind(season.id, email, teamId).run();
        emails += 1;
      }
    }
  }
  return json({ ok: true, teams, emails, created });
}

// Manual fix for students who log in with an email that is not in the sheet: map that email to their team.
async function addRosterEmail(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const email = clean(body.email, 200).toLowerCase(); const short = (ROSTER_SHEETS.find(([, code]) => code === body.university) || [])[1]; const number = Number.parseInt(body.team, 10);
  if (!season || !email.includes('@') || !short || !number) return json({ error: 'Нужни са имейл, университет и номер на екип.' }, 400);
  const teamId = `hrr_team_${season.slug}_${short.toLowerCase()}_${number}`;
  if (!await env.DB.prepare('SELECT id FROM hrr_teams WHERE id=?').bind(teamId).first()) return json({ error: 'Няма такъв екип в сезона.' }, 404);
  await env.DB.prepare('INSERT INTO hrr_team_roster (season_id,email,team_id) VALUES (?,?,?) ON CONFLICT(season_id,email) DO UPDATE SET team_id=excluded.team_id').bind(season.id, email, teamId).run();
  const user = await env.DB.prepare("SELECT * FROM hrr_users WHERE email=? AND role='student'").bind(email).first();
  const joined = Boolean(user) && !await env.DB.prepare('SELECT id FROM hrr_team_members WHERE user_id=? AND season_id=? AND active=1').bind(user.id, season.id).first() && await activeMembers(env, teamId, season.id, user.id) < TEAM_LIMIT;
  if (joined) await addMember(env, season, teamId, user.id);
  return json({ ok: true, teamId, joined, members: await activeMembers(env, teamId, season.id, '') });
}

async function me(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  await autoJoin(env, auth.user);
  const team = await env.DB.prepare('SELECT t.id,t.name,t.university,t.city FROM hrr_team_members tm JOIN hrr_teams t ON t.id=tm.team_id WHERE tm.user_id=? AND tm.active=1 ORDER BY tm.joined_at DESC LIMIT 1').bind(auth.user.id).first();
  return json({ user: auth.user, team });
}

async function ranking(env) {
  const season = await currentSeason(env);
  if (!season) return json({ season: null, teams: [], updatedAt: now() });
  const rows = await env.DB.prepare(`SELECT t.id team_id,t.name team_name,t.university,t.city,
      COALESCE(SUM(CASE WHEN a.scope='team' THEN a.points ELSE a.points*a.completed_count END),0) missions_points,
      COALESCE(SUM(CASE WHEN a.scope='team' THEN 1 ELSE a.completed_count END),0) missions_completed
    FROM hrr_teams t
    LEFT JOIN (
      SELECT s.team_id,s.mission_id,m.scope,m.points,COUNT(*) completed_count
      FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
      WHERE s.status='approved' AND m.season_id=? AND s.team_id IN (SELECT id FROM hrr_teams WHERE season_id=?)
      GROUP BY s.team_id,s.mission_id,m.scope,m.points
    ) a ON a.team_id=t.id
    WHERE t.season_id=? GROUP BY t.id ORDER BY missions_points DESC,t.name ASC`).bind(season.id, season.id, season.id).all();
  return json({ season: season.slug, teams: (rows.results || []).map(row => ({ ...row, missionsPoints: Number(row.missions_points || 0), missionsCompleted: Number(row.missions_completed || 0) })), updatedAt: now() });
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
  const members = await env.DB.prepare(`SELECT u.id,u.display_name,COALESCE(SUM(CASE WHEN s.status='approved' AND m.scope='individual' THEN m.points ELSE 0 END),0) points
    FROM hrr_team_members tm JOIN hrr_users u ON u.id=tm.user_id LEFT JOIN hrr_submissions s ON s.student_user_id=u.id LEFT JOIN hrr_missions m ON m.id=s.mission_id AND m.season_id=?
    WHERE tm.team_id=? AND tm.season_id=? AND tm.active=1 GROUP BY u.id ORDER BY points DESC`).bind(season.id, membership.id, season.id).all();
  const teamPoints = await env.DB.prepare(`SELECT COALESCE(SUM(points),0) points FROM (
    SELECT m.points FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
    WHERE s.team_id=? AND s.status='approved' AND m.scope='team' AND m.season_id=? GROUP BY s.mission_id,m.points
  ) approved_team_missions`).bind(membership.id, season.id).first();
  return json({ team: membership, members: members.results || [], teamPoints: Number(teamPoints?.points || 0) });
}

// Team missions are shared: a submission by either member counts as the whole team's.
const teamOf = async (env, userId, seasonId) => (await env.DB.prepare('SELECT team_id FROM hrr_team_members WHERE user_id=? AND season_id=? AND active=1 LIMIT 1').bind(userId, seasonId).first())?.team_id || '';

async function missions(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env); if (!season) return json({ missions: [] });
  const studentView = auth.user.role === 'student' || (request.headers.get('x-hrr-view') === 'student' && isStudentPreviewUser(auth.user));
  const rows = !studentView && (auth.user.role === 'mentor' || auth.user.role === 'admin')
    ? await env.DB.prepare(`SELECT m.*,u.display_name mentor_name,u.email mentor_email,COUNT(s.id) submissions_pending FROM hrr_missions m LEFT JOIN hrr_users u ON u.id=m.mentor_user_id LEFT JOIN hrr_submissions s ON s.mission_id=m.id AND s.status='pending' WHERE m.season_id=? AND m.status='active' GROUP BY m.id ORDER BY m.created_at DESC`).bind(season.id).all()
    : await env.DB.prepare(`SELECT m.*,u.display_name mentor_name,u.email mentor_email,COALESCE((SELECT status FROM hrr_submissions s WHERE s.mission_id=m.id AND (s.student_user_id=? OR (m.scope='team' AND s.team_id=?)) ORDER BY s.created_at DESC LIMIT 1),'not_started') my_status FROM hrr_missions m LEFT JOIN hrr_users u ON u.id=m.mentor_user_id WHERE m.season_id=? AND m.status='active' ORDER BY m.created_at DESC`).bind(auth.user.id, await teamOf(env, auth.user.id, season.id), season.id).all();
  return json({ missions: studentView ? (rows.results || []).map(maskMission) : rows.results || [] });
}

async function submit(request, env, missionId) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const mission = await env.DB.prepare("SELECT * FROM hrr_missions WHERE id=? AND status='active'").bind(missionId).first();
  // Only a team from the mission's own season counts, so old-season memberships cannot swallow points.
  const membership = mission && await env.DB.prepare('SELECT * FROM hrr_team_members WHERE user_id=? AND season_id=? AND active=1 LIMIT 1').bind(auth.user.id, mission.season_id).first();
  const body = await request.json(); const evidenceUrl = clean(body.evidenceUrl, 1000);
  if (!mission || !membership || (!evidenceUrl && !clean(body.evidenceText, 4000))) return json({ error: 'Mission, team and evidence are required' }, 400);
  if (evidenceUrl && !isSafeUrl(evidenceUrl)) return json({ error: 'Линкът трябва да започва с http:// или https://' }, 400);
  const today = sofiaToday(), end = mission.end_date || mission.deadline;
  if (mission.start_date && mission.start_date > today) return json({ error: 'Мисията още не е започнала.' }, 400);
  if (end && end < today) return json({ error: 'Срокът на мисията е изтекъл.' }, 400);
  const existing = await env.DB.prepare("SELECT student_user_id FROM hrr_submissions WHERE mission_id=? AND status IN ('pending','approved') AND (student_user_id=? OR (?='team' AND team_id=?)) LIMIT 1").bind(missionId, auth.user.id, mission.scope, membership.team_id).first();
  if (existing) return json({ error: existing.student_user_id === auth.user.id ? 'Submission already exists' : 'Отборът ти вече е предал тази мисия.' }, 409);
  const submissionId = id('hrr_submission');
  await env.DB.prepare('INSERT INTO hrr_submissions (id,mission_id,team_id,student_user_id,evidence_url,evidence_text,status,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(submissionId, missionId, membership.team_id, auth.user.id, evidenceUrl, clean(body.evidenceText, 4000), 'pending', now()).run();
  await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), mission.mentor_user_id, 'submission', 'Ново изпълнение на мисия', `${auth.user.display_name} изпрати доказателство за „${mission.title}“.`, now()).run();
  return json({ ok: true, submissionId }, 201);
}

async function mentorSubmissions(request, env) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const rows = await env.DB.prepare(`SELECT s.*,m.title mission_title,m.points,t.name team_name,u.display_name student_name,u.email student_email
    FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id JOIN hrr_teams t ON t.id=s.team_id JOIN hrr_users u ON u.id=s.student_user_id
    WHERE (m.mentor_user_id=? OR ?='admin') ORDER BY CASE s.status WHEN 'pending' THEN 0 ELSE 1 END,s.created_at DESC`).bind(auth.user.id, auth.user.role).all();
  return json({ submissions: rows.results || [] });
}

async function review(request, env, submissionId) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const body = await request.json(); const status = clean(body.status, 20); const note = clean(body.note, 1000);
  if (!['approved', 'rejected'].includes(status)) return json({ error: 'Invalid review status' }, 400);
  const submission = await env.DB.prepare(`SELECT s.*,m.title,m.points,m.scope,m.mentor_user_id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id WHERE s.id=?`).bind(submissionId).first();
  if (!submission || (auth.user.role !== 'admin' && submission.mentor_user_id !== auth.user.id)) return json({ error: 'Submission not found' }, 404);
  if (submission.status !== 'pending') return json({ error: 'Submission already reviewed' }, 409);
  await env.DB.prepare('UPDATE hrr_submissions SET status=?,reviewer_user_id=?,review_note=?,reviewed_at=? WHERE id=? AND status=\'pending\'').bind(status, auth.user.id, note, now(), submissionId).run();
  const recipients = submission.scope === 'team'
    ? ((await env.DB.prepare('SELECT user_id FROM hrr_team_members WHERE team_id=? AND active=1').bind(submission.team_id).all()).results || []).map((row) => row.user_id)
    : [submission.student_user_id];
  for (const userId of new Set([submission.student_user_id, ...recipients])) await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), userId, status, status === 'approved' ? 'Мисията е одобрена' : 'Мисията е отхвърлена', `${submission.title}${note ? ` — ${note}` : ''}`, now()).run();
  return json({ ok: true, status });
}

async function markNotificationsRead(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  await env.DB.prepare('UPDATE hrr_notifications SET read_at=? WHERE user_id=? AND read_at IS NULL').bind(now(), auth.user.id).run();
  return json({ ok: true });
}

async function notifications(request, env, roles = ['student']) {
  const auth = roles.length === 1 && roles[0] === 'student' ? await requireStudent(request, env) : await requireUser(request, env, roles); if (auth.response) return auth.response;
  const rows = await env.DB.prepare('SELECT * FROM hrr_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(auth.user.id).all();
  return json({ notifications: rows.results || [] });
}

async function history(request, env) {
  const auth = await requireStudent(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env); if (!season) return json({ history: [], approvedPoints: 0 });
  const rows = await env.DB.prepare(`SELECT s.id,s.mission_id,s.status,s.review_note,s.created_at submitted_at,s.reviewed_at,
      m.mission_number,m.kind,m.title,m.description,m.category,m.points,m.scope,m.deadline,m.start_date,m.end_date,m.status mission_status,m.created_at published_at,
      u.display_name mentor_name,u.email mentor_email
    FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
    LEFT JOIN hrr_users u ON u.id=m.mentor_user_id
    WHERE (s.student_user_id=? OR (m.scope='team' AND s.team_id=?)) AND m.season_id=? ORDER BY COALESCE(s.reviewed_at,s.created_at) DESC LIMIT 100`).bind(auth.user.id, await teamOf(env, auth.user.id, season.id), season.id).all();
  const points = (rows.results || []).filter((row) => row.status === 'approved').reduce((total, row) => total + Number(row.points || 0), 0);
  return json({ history: (rows.results || []).map(maskMission), approvedPoints: points });
}

async function createMission(request, env) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  const startDate = clean(body.startDate, 20); const endDate = clean(body.endDate, 20);
  const missionNumber = Number(body.missionNumber);
  if (!season || !Number.isInteger(missionNumber) || missionNumber < 0 || !clean(body.title, 160) || !Number.isFinite(Number(body.points)) || (startDate && endDate && startDate > endDate)) return json({ error: 'Mission number, title, points and a valid date range are required' }, 400);
  const missionId = id('hrr_mission');
  await env.DB.prepare('INSERT INTO hrr_missions (id,season_id,mentor_user_id,mission_number,title,description,category,points,deadline,start_date,end_date,scope,status,created_at,kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(missionId, season.id, auth.user.id, missionNumber, clean(body.title, 160), clean(body.description, 4000), 'general', Math.max(0, Number(body.points)), endDate, startDate, endDate, ['individual','team'].includes(body.scope) ? body.scope : 'team', 'active', now(), missionKind(body.kind)).run();
  return json({ ok: true, missionId }, 201);
}

async function updateMission(request, env, missionId) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const mission = await env.DB.prepare('SELECT * FROM hrr_missions WHERE id=?').bind(missionId).first();
  if (!mission || (auth.user.role !== 'admin' && mission.mentor_user_id !== auth.user.id)) return json({ error: 'Mission not found' }, 404);
  const body = await request.json(); const startDate = clean(body.startDate, 20); const endDate = clean(body.endDate, 20); const missionNumber = Number(body.missionNumber ?? mission.mission_number);
  if (!Number.isInteger(missionNumber) || missionNumber < 0 || !clean(body.title, 160) || !Number.isFinite(Number(body.points)) || (startDate && endDate && startDate > endDate)) return json({ error: 'Mission number, title, points and a valid date range are required' }, 400);
  let mentorUserId = mission.mentor_user_id;
  if (auth.user.role === 'admin' && body.mentorUserId) {
    const mentor = await env.DB.prepare("SELECT id FROM hrr_users WHERE id=? AND role IN ('mentor','admin')").bind(clean(body.mentorUserId, 100)).first();
    if (!mentor) return json({ error: 'Invalid mission mentor' }, 400);
    mentorUserId = mentor.id;
  }
  await env.DB.prepare('UPDATE hrr_missions SET mentor_user_id=?,mission_number=?,title=?,description=?,points=?,deadline=?,start_date=?,end_date=?,scope=?,kind=? WHERE id=?').bind(mentorUserId, missionNumber, clean(body.title, 160), clean(body.description, 4000), Math.max(0, Number(body.points)), endDate, startDate, endDate, ['individual','team'].includes(body.scope) ? body.scope : mission.scope || 'team', missionKind(body.kind, mission.kind || 'regular'), missionId).run();
  return json({ ok: true, missionId });
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
  const body = await request.json(); const email = clean(body.email, 240).toLowerCase(); const role = body.role === 'admin' ? 'admin' : 'mentor';
  if (!email || !email.includes('@')) return json({ error: 'Valid email is required' }, 400);
  await env.DB.prepare('INSERT INTO hrr_mentor_allowlist (email,role,active,created_at) VALUES (?,?,1,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role,active=1').bind(email, role, now()).run();
  return json({ ok: true, email, role }, 201);
}

export async function handleHrr(request, env, url) {
  if (!url.pathname.startsWith('/api/hrr/')) return null;
  if (request.method === 'GET' && url.pathname === '/api/hrr/ranking') return ranking(env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/auth/token') {
    const body = await request.json();
    const tokenUrl = `${String(env.HRR_COGNITO_DOMAIN || '').replace(/\/$/, '')}/oauth2/token`;
    if (!env.HRR_COGNITO_DOMAIN || !env.HRR_COGNITO_CLIENT_ID || !tokenUrl.startsWith('https://') || !body.code || !body.codeVerifier) return json({ error: 'Cognito configuration is incomplete' }, 503);
    const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: env.HRR_COGNITO_CLIENT_ID, code: body.code, redirect_uri: clean(body.redirectUri, 500), code_verifier: body.codeVerifier });
    const response = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form });
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  if (request.method === 'GET' && url.pathname === '/api/hrr/me') return me(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/teams/join') return joinTeam(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/team') return team(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/missions') return missions(request, env);
  if (request.method === 'POST' && /^\/api\/hrr\/missions\/[^/]+\/submissions$/.test(url.pathname)) return submit(request, env, url.pathname.split('/')[4]);
  if (request.method === 'GET' && url.pathname === '/api/hrr/mentor/submissions') return mentorSubmissions(request, env);
  if (request.method === 'POST' && /^\/api\/hrr\/mentor\/submissions\/[^/]+\/review$/.test(url.pathname)) return review(request, env, url.pathname.split('/')[5]);
  if (request.method === 'GET' && url.pathname === '/api/hrr/notifications') return notifications(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/notifications/read') return markNotificationsRead(request, env);
  if (request.method === 'GET' && url.pathname === '/api/hrr/mentor/notifications') return notifications(request, env, ['mentor', 'admin']);
  if (request.method === 'GET' && url.pathname === '/api/hrr/history') return history(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/mentor/missions') return createMission(request, env);
  if (request.method === 'PATCH' && /^\/api\/hrr\/mentor\/missions\/[^/]+$/.test(url.pathname)) return updateMission(request, env, url.pathname.split('/').at(-1));
  if (request.method === 'DELETE' && /^\/api\/hrr\/mentor\/missions\/[^/]+$/.test(url.pathname)) return archiveMission(request, env, url.pathname.split('/').at(-1));
  if (request.method === 'GET' && url.pathname === '/api/hrr/admin/mentors') return mentorDirectory(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/teams') return createTeam(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/roster') return addRosterEmail(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/teams/sync') return syncTeams(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/allowlist') return addMentor(request, env);
  return json({ error: 'Not found' }, 404);
}
