// Безплатна регистрация с автоматичен билет по имейл (Национален младежки Summit и следващи безплатни събития).
// Събитието е безплатно, когато в D1 има активен ticket_type с price_cents = 0.
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});
const now = () => new Date().toISOString();
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const html = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 6 знака без 0/O/1/I, за да се диктува лесно на входа.
const ticketCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

// Отговорите се препращат и към Google формуляра на организаторите.
export const GOOGLE_FORMS = {
  'national-youth-summit': {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfH-oRiNphEbGa3zut6V_qxf5NL62irVQuRigoS4dbMOCnxEw/formResponse',
    fields: { organization: 'entry.1191599617', fullName: 'entry.1078278582', phone: 'entry.988739255', email: 'entry.1284682467' }
  }
};

function base64(bytes) {
  let output = '';
  for (let i = 0; i < bytes.length; i += 0x8000) output += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(output);
}

async function forwardToGoogleForm(slug, values) {
  const form = GOOGLE_FORMS[slug];
  if (!form) return 'skipped';
  const body = new URLSearchParams();
  for (const [key, entry] of Object.entries(form.fields)) body.append(entry, values[key]);
  const response = await fetch(form.url, { method: 'POST', body });
  if (!response.ok) throw new Error(`Google Form returned ${response.status}`);
  return 'sent';
}

async function sendTicket(env, event, order, attendee, makePdf, origin) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return 'skipped';
  // QR кодът и линкът водят към проверката на билета в самия Worker (sofiasummit.bg/api не е насочен към него).
  const ticketUrl = `${origin}/api/tickets/${attendee.ticket_token}`;
  const pdf = await makePdf(event, attendee, ticketUrl);
  const when = new Date(event.starts_at).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'long', timeStyle: 'short' });
  const message = `<h1>${html(event.name)}</h1><p>Здравейте, ${html(attendee.full_name)}!</p><p>Регистрацията е потвърдена. Участието е безплатно.</p><p><strong>Организация:</strong> ${html(attendee.organization)}<br><strong>Кога:</strong> ${html(when)} ч.<br><strong>Къде:</strong> ${html(event.venue)}</p><p><strong>Код на билета:</strong> <span style="font-family:monospace;font-size:20px;letter-spacing:3px">${html(attendee.ticket_token)}</span></p><p><a href="${html(ticketUrl)}">Отвори онлайн билета</a></p><p>Покажете QR кода от приложения PDF билет на входа.</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [attendee.email], subject: `Билет за ${event.name}`, html: message, attachments: [{ filename: `ticket-${attendee.ticket_token}.pdf`, content: base64(pdf) }] })
  });
  const result = await response.json().catch(() => ({}));
  await env.DB.prepare("INSERT OR REPLACE INTO email_log (id, order_id, attendee_id, recipient, email_type, provider_id, status, sent_at) VALUES (?,?,?,?,'ticket',?,?,?)")
    .bind(`email_${crypto.randomUUID()}`, order.id, attendee.id, attendee.email, result.id || null, response.ok ? 'sent' : 'failed', now()).run();
  return response.ok ? 'sent' : 'failed';
}

export async function handleFreeRegistration(request, env, ctx, url, headers, makePdf) {
  if (request.method !== 'POST' || url.pathname !== '/api/free-registrations') return null;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'Невалидни данни.' }, 400, headers);
  const values = {
    organization: clean(body.organization, 160), fullName: clean(body.fullName, 120),
    phone: clean(body.phone, 40), email: clean(body.email, 160).toLowerCase()
  };
  if (!values.organization || !values.fullName || !values.phone || !values.email) return json({ error: 'Моля, попълнете всички полета.' }, 400, headers);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return json({ error: 'Въведете валиден имейл адрес.' }, 400, headers);
  if (body.consent !== true) return json({ error: 'Необходимо е съгласие за обработване на данните.' }, 400, headers);

  const slug = clean(body.eventSlug, 80);
  const event = await env.DB.prepare("SELECT e.*, t.id ticket_type_id, t.name ticket_name FROM events e JOIN ticket_types t ON t.event_id = e.id AND t.active = 1 AND t.price_cents = 0 WHERE e.slug = ? AND e.status = 'active'").bind(slug).first();
  if (!event) return json({ error: 'Регистрацията за това събитие не е отворена.' }, 404, headers);

  const existing = await env.DB.prepare("SELECT a.id FROM attendees a JOIN orders o ON o.id = a.order_id WHERE o.event_id = ? AND o.status = 'paid' AND a.email = ?").bind(event.id, values.email).first();
  if (existing) return json({ ok: true, already: true, message: 'Вече сте регистрирани с този имейл. Билетът е изпратен при първата регистрация.' }, 200, headers);

  const created = now();
  const order = { id: `order_${crypto.randomUUID()}` };
  const attendee = { id: `att_${crypto.randomUUID()}`, full_name: values.fullName, email: values.email, organization: values.organization };
  let inserted = false;
  // ponytail: повтаря само при сблъсък на кода (32^6 комбинации), не при други грешки.
  for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
    attendee.ticket_token = ticketCode();
    try {
      const results = await env.DB.batch([
        env.DB.prepare(`INSERT INTO orders (id,event_id,ticket_type_id,buyer_name,buyer_email,buyer_phone,attendee_count,promo_code,amount_cents,currency,status,payment_url,payment_reference,ticket_token,expires_at,paid_at,created_at,updated_at)
          SELECT ?,?,?,?,?,?,1,NULL,0,'EUR','paid',NULL,'free',?,?,?,?,? WHERE (SELECT COALESCE(SUM(attendee_count),0) FROM orders WHERE event_id = ? AND status = 'paid') < ?`)
          .bind(order.id, event.id, event.ticket_type_id, values.fullName, values.email, values.phone, crypto.randomUUID(), created, created, created, created, event.id, event.capacity),
        env.DB.prepare('INSERT INTO attendees (id, order_id, attendee_no, full_name, email, phone, organization, ticket_token) SELECT ?,?,1,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)')
          .bind(attendee.id, order.id, values.fullName, values.email, values.phone, values.organization, attendee.ticket_token, order.id)
      ]);
      if (!results[0].meta?.changes) return json({ error: 'Местата за събитието са запълнени.' }, 409, headers);
      inserted = true;
    } catch (error) {
      if (!/UNIQUE/i.test(String(error?.message))) throw error;
    }
  }
  if (!inserted) return json({ error: 'Възникна техническа грешка. Моля, опитайте отново.' }, 500, headers);

  ctx.waitUntil(Promise.allSettled([
    sendTicket(env, event, order, attendee, makePdf, url.origin),
    forwardToGoogleForm(slug, values)
  ]).then((results) => results.forEach((r) => { if (r.status === 'rejected') console.error('[free-registration]', r.reason); })));
  return json({ ok: true, message: 'Регистрацията е потвърдена. Билетът идва на посочения имейл до няколко минути.' }, 201, headers);
}
