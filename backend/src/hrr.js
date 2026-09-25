import { hrrUser } from './hrr-auth.js';

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

async function currentSeason(env) {
  return env.DB.prepare("SELECT * FROM hrr_seasons WHERE status='active' ORDER BY id LIMIT 1").first();
}

async function me(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const team = await env.DB.prepare('SELECT t.id,t.name,t.university,t.city FROM hrr_team_members tm JOIN hrr_teams t ON t.id=tm.team_id WHERE tm.user_id=? AND tm.active=1 ORDER BY tm.joined_at DESC LIMIT 1').bind(auth.user.id).first();
  return json({ user: auth.user, team });
}

async function joinTeam(request, env) {
  const auth = await requireUser(request, env, ['student']); if (auth.response) return auth.response;
  const body = await request.json(); const code = clean(body.code, 80); const season = await currentSeason(env);
  if (!season || !code) return json({ error: 'Missing team code' }, 400);
  const team = await env.DB.prepare('SELECT * FROM hrr_teams WHERE season_id=? AND join_code_hash=?').bind(season.id, await hash(code)).first();
  if (!team) return json({ error: 'Invalid team code' }, 404);
  await env.DB.prepare('UPDATE hrr_team_members SET active=0 WHERE user_id=? AND active=1').bind(auth.user.id).run();
  const previous = await env.DB.prepare('SELECT id FROM hrr_team_members WHERE team_id=? AND user_id=? LIMIT 1').bind(team.id, auth.user.id).first();
  if (previous) await env.DB.prepare('UPDATE hrr_team_members SET season_id=?,active=1,joined_at=? WHERE id=?').bind(season.id, now(), previous.id).run();
  else await env.DB.prepare('INSERT INTO hrr_team_members (id,season_id,team_id,user_id,active,joined_at) VALUES (?,?,?,?,1,?)').bind(id('hrr_member'), season.id, team.id, auth.user.id, now()).run();
  return json({ ok: true, team });
}

async function team(request, env) {
  const auth = await requireUser(request, env, ['student']); if (auth.response) return auth.response;
  const membership = await env.DB.prepare('SELECT t.* FROM hrr_team_members tm JOIN hrr_teams t ON t.id=tm.team_id WHERE tm.user_id=? AND tm.active=1 LIMIT 1').bind(auth.user.id).first();
  if (!membership) return json({ team: null, members: [] });
  const members = await env.DB.prepare(`SELECT u.id,u.display_name,u.email,COALESCE(SUM(CASE WHEN s.status='approved' AND m.scope='individual' THEN m.points ELSE 0 END),0) points
    FROM hrr_team_members tm JOIN hrr_users u ON u.id=tm.user_id LEFT JOIN hrr_submissions s ON s.student_user_id=u.id LEFT JOIN hrr_missions m ON m.id=s.mission_id
    WHERE tm.team_id=? AND tm.active=1 GROUP BY u.id ORDER BY points DESC`).bind(membership.id).all();
  const teamPoints = await env.DB.prepare(`SELECT COALESCE(SUM(m.points),0) points
    FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
    WHERE s.team_id=? AND s.status='approved' AND m.scope='team'`).bind(membership.id).first();
  return json({ team: membership, members: members.results || [], teamPoints: Number(teamPoints?.points || 0) });
}

async function missions(request, env) {
  const auth = await requireUser(request, env); if (auth.response) return auth.response;
  const season = await currentSeason(env); if (!season) return json({ missions: [] });
  const rows = auth.user.role === 'mentor' || auth.user.role === 'admin'
    ? await env.DB.prepare(`SELECT m.*,COUNT(s.id) submissions_pending FROM hrr_missions m LEFT JOIN hrr_submissions s ON s.mission_id=m.id AND s.status='pending' WHERE m.season_id=? AND (m.mentor_user_id=? OR ?='admin') GROUP BY m.id ORDER BY m.created_at DESC`).bind(season.id, auth.user.id, auth.user.role).all()
    : await env.DB.prepare(`SELECT m.*,COALESCE((SELECT status FROM hrr_submissions s WHERE s.mission_id=m.id AND s.student_user_id=? ORDER BY s.created_at DESC LIMIT 1),'not_started') my_status FROM hrr_missions m WHERE m.season_id=? AND m.status='active' ORDER BY m.created_at DESC`).bind(auth.user.id, season.id).all();
  return json({ missions: rows.results || [] });
}

async function submit(request, env, missionId) {
  const auth = await requireUser(request, env, ['student']); if (auth.response) return auth.response;
  const mission = await env.DB.prepare("SELECT * FROM hrr_missions WHERE id=? AND status='active'").bind(missionId).first();
  const membership = await env.DB.prepare('SELECT * FROM hrr_team_members WHERE user_id=? AND active=1 LIMIT 1').bind(auth.user.id).first();
  const body = await request.json();
  if (!mission || !membership || (!clean(body.evidenceUrl, 1000) && !clean(body.evidenceText, 4000))) return json({ error: 'Mission, team and evidence are required' }, 400);
  const existing = await env.DB.prepare("SELECT id FROM hrr_submissions WHERE mission_id=? AND student_user_id=? AND status IN ('pending','approved') LIMIT 1").bind(missionId, auth.user.id).first();
  if (existing) return json({ error: 'Submission already exists' }, 409);
  const submissionId = id('hrr_submission');
  await env.DB.prepare('INSERT INTO hrr_submissions (id,mission_id,team_id,student_user_id,evidence_url,evidence_text,status,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(submissionId, missionId, membership.team_id, auth.user.id, clean(body.evidenceUrl, 1000), clean(body.evidenceText, 4000), 'pending', now()).run();
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
  const submission = await env.DB.prepare(`SELECT s.*,m.title,m.points,m.mentor_user_id FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id WHERE s.id=?`).bind(submissionId).first();
  if (!submission || (auth.user.role !== 'admin' && submission.mentor_user_id !== auth.user.id)) return json({ error: 'Submission not found' }, 404);
  if (submission.status !== 'pending') return json({ error: 'Submission already reviewed' }, 409);
  await env.DB.prepare('UPDATE hrr_submissions SET status=?,reviewer_user_id=?,review_note=?,reviewed_at=? WHERE id=? AND status=\'pending\'').bind(status, auth.user.id, note, now(), submissionId).run();
  await env.DB.prepare('INSERT INTO hrr_notifications (id,user_id,type,title,body,created_at) VALUES (?,?,?,?,?,?)').bind(id('hrr_note'), submission.student_user_id, status, status === 'approved' ? 'Мисията е одобрена' : 'Мисията е отхвърлена', `${submission.title}${note ? ` — ${note}` : ''}`, now()).run();
  return json({ ok: true, status });
}

async function notifications(request, env, roles = ['student']) {
  const auth = await requireUser(request, env, roles); if (auth.response) return auth.response;
  const rows = await env.DB.prepare('SELECT * FROM hrr_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(auth.user.id).all();
  return json({ notifications: rows.results || [] });
}

async function history(request, env) {
  const auth = await requireUser(request, env, ['student']); if (auth.response) return auth.response;
  const rows = await env.DB.prepare(`SELECT s.id,s.status,s.review_note,s.created_at,s.reviewed_at,m.title,m.points,m.scope
    FROM hrr_submissions s JOIN hrr_missions m ON m.id=s.mission_id
    WHERE s.student_user_id=? ORDER BY COALESCE(s.reviewed_at,s.created_at) DESC LIMIT 100`).bind(auth.user.id).all();
  const points = (rows.results || []).filter((row) => row.status === 'approved').reduce((total, row) => total + Number(row.points || 0), 0);
  return json({ history: rows.results || [], approvedPoints: points });
}

async function createMission(request, env) {
  const auth = await requireUser(request, env, ['mentor', 'admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json();
  if (!season || !clean(body.title, 160) || !Number.isFinite(Number(body.points))) return json({ error: 'Title and points are required' }, 400);
  const missionId = id('hrr_mission');
  await env.DB.prepare('INSERT INTO hrr_missions (id,season_id,mentor_user_id,title,description,category,points,deadline,scope,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(missionId, season.id, auth.user.id, clean(body.title, 160), clean(body.description, 4000), clean(body.category, 40) || 'general', Math.max(0, Number(body.points)), clean(body.deadline, 80), ['individual','team'].includes(body.scope) ? body.scope : 'team', 'active', now()).run();
  return json({ ok: true, missionId }, 201);
}

async function createTeam(request, env) {
  const auth = await requireUser(request, env, ['admin']); if (auth.response) return auth.response;
  const season = await currentSeason(env); const body = await request.json(); const code = clean(body.joinCode, 80);
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
  if (request.method === 'GET' && url.pathname === '/api/hrr/mentor/notifications') return notifications(request, env, ['mentor', 'admin']);
  if (request.method === 'GET' && url.pathname === '/api/hrr/history') return history(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/mentor/missions') return createMission(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/teams') return createTeam(request, env);
  if (request.method === 'POST' && url.pathname === '/api/hrr/admin/allowlist') return addMentor(request, env);
  return json({ error: 'Not found' }, 404);
}
