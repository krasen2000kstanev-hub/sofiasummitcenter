const jwksCache = new Map();
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const GOOGLE_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const STUDENT_PREVIEW_EMAILS = new Set(['krasen.k.stanev@gmail.com', 'krasen2000.k.stanev@gmail.com']);

export const isStudentPreviewUser = (user) => STUDENT_PREVIEW_EMAILS.has(String(user?.email || '').trim().toLowerCase());

const base64UrlToBytes = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const decodePart = (value) => JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));

async function getJwks(url) {
  const cached = jwksCache.get(url);
  if (cached?.expiresAt > Date.now()) return cached.keys;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Signing keys unavailable');
  const keys = (await response.json()).keys || [];
  jwksCache.set(url, { keys, expiresAt: Date.now() + 3600000 });
  return keys;
}

// Google ID token (direct sign-in, no AWS) or, during the switch-over, a Cognito token.
// ponytail: the Cognito branch only covers sessions opened before the switch; drop it and the HRR_COGNITO_* vars once those expire.
export async function verifyHrrAccessToken(token, env) {
  const [encodedHeader, encodedPayload, encodedSignature] = String(token || '').split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error('Invalid token');
  const header = decodePart(encodedHeader);
  const payload = decodePart(encodedPayload);
  if (!(payload.exp * 1000 > Date.now())) throw new Error('Expired or invalid token');
  let jwksUrl;
  if (GOOGLE_ISSUERS.has(payload.iss)) {
    if (!env.HRR_GOOGLE_CLIENT_ID || payload.aud !== env.HRR_GOOGLE_CLIENT_ID) throw new Error('Wrong token audience');
    if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('Google имейлът не е потвърден.');
    jwksUrl = GOOGLE_JWKS;
  } else {
    const issuer = String(env.HRR_COGNITO_ISSUER || '').replace(/\/$/, '');
    if (!issuer || payload.iss !== issuer) throw new Error('Expired or invalid token');
    const audienceOk = payload.token_use === 'access' ? payload.client_id === env.HRR_COGNITO_CLIENT_ID : payload.token_use === 'id' && payload.aud === env.HRR_COGNITO_CLIENT_ID;
    if (!audienceOk) throw new Error('Wrong token audience');
    jwksUrl = `${issuer}/.well-known/jwks.json`;
  }
  const jwk = (await getJwks(jwksUrl)).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');
  const cryptoKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, base64UrlToBytes(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
  if (!valid) throw new Error('Invalid token signature');
  return payload;
}

// Organizer-blocked addresses (e.g. a duplicate account of a student), comma-separated in HRR_BLOCKED_EMAILS.
export const isBlockedEmail = (env, email) => String(env.HRR_BLOCKED_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean).includes(String(email).trim().toLowerCase());

// Platform session (60 days) handed out after one Google sign-in; only its SHA-256 is stored.
export const SESSION_PREFIX = 'hrrs_';
const SESSION_DAYS = 60;
const sha256 = async (value) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function createSession(env, user) {
  const token = SESSION_PREFIX + [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const timestamp = new Date().toISOString();
  await env.DB.prepare('DELETE FROM hrr_sessions WHERE expires_at<?').bind(timestamp).run();
  await env.DB.prepare('INSERT INTO hrr_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(await sha256(token), user.id, new Date(Date.now() + SESSION_DAYS * 86400000).toISOString(), timestamp).run();
  return token;
}

export async function deleteSession(env, token) {
  if (String(token).startsWith(SESSION_PREFIX)) await env.DB.prepare('DELETE FROM hrr_sessions WHERE token_hash=?').bind(await sha256(token)).run();
}

// The role is re-read from the allowlist on every request, so granting or removing panel access applies without signing in again.
async function sessionUser(token, env) {
  const user = await env.DB.prepare('SELECT u.* FROM hrr_sessions s JOIN hrr_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await sha256(token), new Date().toISOString()).first();
  if (!user) throw new Error('Expired or invalid token');
  if (isBlockedEmail(env, user.email)) throw new Error('Този имейл не е разрешен за HR:Rush. Влез с имейла, с който си в екипа.');
  const allowlist = await env.DB.prepare('SELECT role FROM hrr_mentor_allowlist WHERE email=? AND active=1').bind(String(user.email).toLowerCase()).first();
  return { ...user, role: allowlist?.role || 'student' };
}

export async function hrrUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  if (header.slice(7).startsWith(SESSION_PREFIX)) return sessionUser(header.slice(7), env);
  const claims = await verifyHrrAccessToken(header.slice(7), env);
  const email = String(claims.email || claims['cognito:username'] || claims.username || '').trim().toLowerCase();
  if (!email) throw new Error('Token has no email');
  if (isBlockedEmail(env, email)) throw new Error('Този имейл не е разрешен за HR:Rush. Влез с имейла, с който си в екипа.');
  const allowlist = await env.DB.prepare('SELECT role FROM hrr_mentor_allowlist WHERE email=? AND active=1').bind(email).first();
  const subject = claims.sub || claims.username;
  const existing = await env.DB.prepare('SELECT * FROM hrr_users WHERE cognito_sub=? OR email=? LIMIT 1').bind(subject, email).first();
  const role = allowlist?.role || 'student';
  // ponytail: hrr_users.role only allows student/mentor/admin, so a viewer is stored as 'student' and gets 'viewer' in memory; rebuild hrr_users if more roles appear.
  const storedRole = role === 'viewer' ? 'student' : role;
  const timestamp = new Date().toISOString();
  if (existing) {
    await env.DB.prepare('UPDATE hrr_users SET cognito_sub=?, email=?, display_name=?, role=?, updated_at=? WHERE id=?').bind(subject, email, claims.name || existing.display_name || email, storedRole, timestamp, existing.id).run();
  } else {
    await env.DB.prepare('INSERT INTO hrr_users (id,cognito_sub,email,display_name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(`hrr_user_${crypto.randomUUID()}`, subject, email, claims.name || email, storedRole, timestamp, timestamp).run();
  }
  const user = await env.DB.prepare('SELECT * FROM hrr_users WHERE cognito_sub=?').bind(subject).first();
  if (user && role === 'viewer') user.role = 'viewer';
  return user;
}
