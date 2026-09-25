const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

const now = () => new Date().toISOString();
const makeId = () => `hrr_app_${crypto.randomUUID()}`;
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const html = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function validate(body) {
  const role = clean(body.role, 20);
  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const organization = clean(body.organization, 180);
  const university = clean(body.university, 180);
  const specialty = clean(body.specialty, 180);
  const phone = clean(body.phone, 50);
  const email = clean(body.email, 254).toLowerCase();
  if (!['student', 'company', 'university'].includes(role)) return 'Изберете валидна роля.';
  if (!firstName || !lastName || !phone || !email) return 'Попълнете всички задължителни полета.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Въведете валиден имейл адрес.';
  if (role === 'student' && (!university || !specialty)) return 'За студентска кандидатура са нужни университет и специалност.';
  if (role !== 'student' && !organization) return 'Въведете организацията, която представлявате.';
  if (body.gdprConsent !== true) return 'Необходимо е съгласие за обработване на личните данни.';
  return { role, firstName, lastName, organization, university, specialty, phone, email };
}

export async function submitHrrApplication(request, env, ctx, headers = {}) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Невалидни данни.' }, 400, headers); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Невалидни данни.' }, 400, headers);
  const values = validate(body);
  if (typeof values === 'string') return json({ error: values }, 400, headers);

  const configuredSeason = Number(env.HRR_APPLICATION_SEASON || 9);
  if (!Number.isInteger(configuredSeason) || configuredSeason < 1) return json({ error: 'Кандидатстването временно не е достъпно.' }, 503, headers);
  const createdAt = now();
  const applicationId = makeId();
  await env.DB.batch([env.DB.prepare(`INSERT INTO hrr_applications
    (id,season,role,first_name,last_name,organization,university,specialty,phone,email,gdpr_consent,consent_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`)
    .bind(applicationId, configuredSeason, values.role, values.firstName, values.lastName, values.organization,
      values.university, values.specialty, values.phone, values.email, createdAt, createdAt),
    ...['sheet', 'organizer_email', 'applicant_email'].map((kind) => env.DB.prepare(`INSERT INTO hrr_application_outbox
      (id,application_id,kind,status,attempts,available_at,created_at) VALUES (?,?,?,'pending',0,?,?)`)
      .bind(`${applicationId}:${kind}`, applicationId, kind, createdAt, createdAt))
  ]);
  const storedApplication = await env.DB.prepare('SELECT application_no FROM hrr_applications WHERE id=?').bind(applicationId).first();
  const applicationNo = Number(storedApplication?.application_no);
  if (!Number.isSafeInteger(applicationNo) || applicationNo < 1) throw new Error('Could not read application number');
  if (ctx?.waitUntil) ctx.waitUntil(processHrrApplicationOutbox(env));
  return json({ ok: true, applicationId, message: 'Кандидатурата е получена.' }, 201, headers);
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function googleAccessToken(env) {
  const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  if (!account.client_email || !account.private_key) throw new Error('Google Sheets backend credential is not configured');
  const issuedAt = Math.floor(Date.now() / 1000);
  const encode = (value) => base64url(new TextEncoder().encode(JSON.stringify(value)));
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600
  })}`;
  const pem = account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const keyBytes = Uint8Array.from(atob(pem), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', keyBytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  const assertion = `${unsigned}.${base64url(signature)}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(`Google token request failed (${response.status})`);
  return data.access_token;
}

async function writeApplicationToSheet(env, application) {
  if (!env.HRR_APPLICATIONS_SHEET_ID) throw new Error('Google Sheet ID is not configured');
  const token = await googleAccessToken(env);
  const rowNumber = Number(application.application_no) + 1;
  const sheetId = encodeURIComponent(env.HRR_APPLICATIONS_SHEET_ID);
  const metadataResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title,gridProperties(rowCount)))`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const metadata = await metadataResponse.json().catch(() => ({}));
  if (!metadataResponse.ok) throw new Error(`Google Sheets metadata read failed (${metadataResponse.status})`);
  const tab = (metadata.sheets || []).find((item) => item.properties?.title === 'Кандидатури');
  if (!tab) throw new Error('Google Sheet is missing the Кандидатури tab');
  const currentRows = Number(tab.properties.gridProperties?.rowCount || 0);
  if (currentRows < rowNumber) {
    const extend = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ requests: [{ appendDimension: { sheetId: tab.properties.sheetId, dimension: 'ROWS', length: Math.max(1000, rowNumber - currentRows) } }] })
    });
    if (!extend.ok) throw new Error(`Google Sheets row extension failed (${extend.status})`);
  }
  const range = `'Кандидатури'!A${rowNumber}:M${rowNumber}`;
  const values = [[
    application.application_no, application.created_at, application.season,
    application.role, application.first_name, application.last_name,
    application.organization, application.university, application.specialty,
    application.phone, application.email, 'Да', application.status
  ]];
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values })
  });
  if (!response.ok) throw new Error(`Google Sheets write failed (${response.status})`);
}

async function sendApplicationEmail(env, kind, application) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error('Email service is not configured');
  const organizer = kind === 'organizer_email';
  const recipient = organizer ? env.HRR_APPLICATION_NOTIFICATION_EMAIL : application.email;
  if (!recipient) throw new Error('Email recipient is not configured');
  const message = organizer
    ? '<p>Получена е нова кандидатура за HR:Rush for Practice. Отворете защитения администраторски списък, за да я прегледате.</p>'
    : `<p>Здравейте, ${html(application.first_name)}!</p><p>Получихме кандидатурата Ви за HR:Rush for Practice, сезон ${Number(application.season)}. Ще се свържем с Вас при следващи стъпки.</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [recipient],
      subject: organizer ? 'Нова кандидатура — HR:Rush for Practice' : 'Потвърждение на кандидатурата — HR:Rush for Practice',
      html: message
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend delivery failed (${response.status})`);
  return result.id || null;
}

async function deliver(env, outbox, application) {
  if (outbox.kind === 'sheet') {
    await writeApplicationToSheet(env, application);
    return null;
  }
  return sendApplicationEmail(env, outbox.kind, application);
}

export async function processHrrApplicationOutbox(env, maxItems = 30) {
  if (!env.DB) return;
  const timestamp = now();
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const due = await env.DB.prepare(`SELECT id FROM hrr_application_outbox
    WHERE (status='pending' AND available_at<=?) OR (status='processing' AND locked_at<?)
    ORDER BY created_at LIMIT ?`).bind(timestamp, staleBefore, maxItems).all();
  for (const item of due.results || []) {
    const claimedAt = now();
    const claim = await env.DB.prepare(`UPDATE hrr_application_outbox
      SET status='processing',attempts=attempts+1,locked_at=?
      WHERE id=? AND ((status='pending' AND available_at<=?) OR (status='processing' AND locked_at<?))`)
      .bind(claimedAt, item.id, claimedAt, staleBefore).run();
    if (!claim.meta?.changes) continue;
    const outbox = await env.DB.prepare('SELECT * FROM hrr_application_outbox WHERE id=?').bind(item.id).first();
    const application = await env.DB.prepare('SELECT * FROM hrr_applications WHERE id=?').bind(outbox.application_id).first();
    try {
      const providerId = await deliver(env, outbox, application);
      await env.DB.prepare(`UPDATE hrr_application_outbox SET status='sent',provider_id=?,completed_at=?,locked_at=NULL,last_error=NULL WHERE id=?`)
        .bind(providerId, now(), item.id).run();
    } catch (error) {
      const attempts = Number(outbox.attempts || 0) + 1;
      const delayMs = Math.min(6 * 60 * 60 * 1000, 30_000 * (2 ** Math.min(attempts - 1, 10)));
      const retryAt = new Date(Date.now() + delayMs).toISOString();
      await env.DB.prepare(`UPDATE hrr_application_outbox SET status='pending',available_at=?,locked_at=NULL,last_error=? WHERE id=?`)
        .bind(retryAt, clean(error?.message || 'Delivery failed', 240), item.id).run();
      console.error('[hrr-application-outbox]', item.id, error);
    }
  }
}

export async function handleHrrApplications(request, env, ctx, url, headers = {}) {
  if (request.method === 'POST' && url.pathname === '/api/apply') return submitHrrApplication(request, env, ctx, headers);
  return null;
}
