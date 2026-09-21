let jwksCache = null;

const base64UrlToBytes = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const decodePart = (value) => JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));

async function getJwks(issuer) {
  if (jwksCache?.issuer === issuer && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(`${issuer.replace(/\/$/, '')}/.well-known/jwks.json`);
  if (!response.ok) throw new Error('Cognito JWKS unavailable');
  const keys = (await response.json()).keys || [];
  jwksCache = { issuer, keys, expiresAt: Date.now() + 3600000 };
  return keys;
}

export async function verifyHrrAccessToken(token, env) {
  const [encodedHeader, encodedPayload, encodedSignature] = String(token || '').split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error('Invalid token');
  const header = decodePart(encodedHeader);
  const payload = decodePart(encodedPayload);
  const issuer = String(env.HRR_COGNITO_ISSUER || '').replace(/\/$/, '');
  if (!issuer || payload.iss !== issuer || payload.exp * 1000 <= Date.now()) throw new Error('Expired or invalid token');
  const audienceOk = payload.token_use === 'access' ? payload.client_id === env.HRR_COGNITO_CLIENT_ID : payload.token_use === 'id' && payload.aud === env.HRR_COGNITO_CLIENT_ID;
  if (!audienceOk) throw new Error('Wrong token audience');
  const jwk = (await getJwks(issuer)).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');
  const cryptoKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, base64UrlToBytes(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
  if (!valid) throw new Error('Invalid token signature');
  return payload;
}

export async function hrrUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const claims = await verifyHrrAccessToken(header.slice(7), env);
  const email = String(claims.email || claims['cognito:username'] || claims.username || '').trim().toLowerCase();
  if (!email) throw new Error('Token has no email');
  const allowlist = await env.DB.prepare('SELECT role FROM hrr_mentor_allowlist WHERE email=? AND active=1').bind(email).first();
  const existing = await env.DB.prepare('SELECT * FROM hrr_users WHERE cognito_sub=?').bind(claims.sub || claims.username).first();
  const role = allowlist?.role || 'student';
  const timestamp = new Date().toISOString();
  if (existing) {
    await env.DB.prepare('UPDATE hrr_users SET email=?, display_name=?, role=?, updated_at=? WHERE cognito_sub=?').bind(email, claims.name || existing.display_name || email, role, timestamp, claims.sub || claims.username).run();
  } else {
    await env.DB.prepare('INSERT INTO hrr_users (id,cognito_sub,email,display_name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(`hrr_user_${crypto.randomUUID()}`, claims.sub || claims.username, email, claims.name || email, role, timestamp, timestamp).run();
  }
  return await env.DB.prepare('SELECT * FROM hrr_users WHERE cognito_sub=?').bind(claims.sub || claims.username).first();
}
