const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...extra }
});

const cors = (request) => ({
  'access-control-allow-origin': request.headers.get('Origin') || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization,x-dsk-signature',
  'access-control-max-age': '86400'
});

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const clean = (value, max = 240) => String(value || '').trim().slice(0, max);
const html = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function adminAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const raw = atob(header.slice(6));
    return raw === `${env.ADMIN_USER}:${env.ADMIN_PASSWORD}`;
  } catch { return false; }
}

function requireAdmin(request, env) {
  if (adminAuth(request, env)) return null;
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Sofia Summit admin"' }
  });
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json();
  const form = await request.formData();
  const attendeesCount = Number(form.get('attendeesCount') ?? 1);
  const attendees = [{ fullName: form.get('fullName'), email: form.get('email'), phone: form.get('phone') }];
  for (let i = 2; Number.isInteger(attendeesCount) && attendeesCount <= 100 && i <= attendeesCount; i++) attendees.push({
    fullName: form.get(`attendee${i}Name`), email: form.get(`attendee${i}Email`), phone: form.get(`attendee${i}Phone`)
  });
  return {
    eventSlug: form.get('eventSlug') || 'nail-business-restart',
    ticketType: form.get('ticketType') || 'standard',
    fullName: form.get('fullName'), email: form.get('email'), phone: form.get('phone'),
    promoCode: form.get('promoCode'), attendeesCount, attendees,
    masterClasses: form.getAll('masterClass'), agreeTerms: form.get('agreeTerms')
  };
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(raw, signature, secret) {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const expected = [...new Uint8Array(signed)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === signature.replace(/^sha256=/, '').toLowerCase();
}

async function sendTicketEmail(env, order, attendees, event, ticketUrl) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { status: 'skipped' };
  const html = `<h1>${event.name}</h1><p>Регистрацията и плащането са потвърдени.</p><p><strong>Номер на поръчка:</strong> ${order.id}</p><p><strong>Участници:</strong> ${attendees.map((a) => clean(a.full_name)).join(', ')}</p><p><a href="${ticketUrl}">Отвори билета</a></p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [order.buyer_email], subject: `Билет за ${event.name}`, html })
  });
  const result = await response.json().catch(() => ({}));
  await env.DB.prepare('INSERT INTO email_log (id, order_id, recipient, email_type, provider_id, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id('email'), order.id, order.buyer_email, 'ticket', result.id || null, response.ok ? 'sent' : 'failed', now()).run();
  return { status: response.ok ? 'sent' : 'failed', providerId: result.id || null };
}

async function createOrder(request, env) {
  const headers = cors(request);
  const body = await readBody(request);
  const eventSlug = clean(body.eventSlug || 'nail-business-restart', 80);
  const ticketKey = clean(body.ticketType || 'standard', 50);
  const name = clean(body.fullName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const count = Number(body.attendeesCount ?? ((body.attendees || []).length || 1));
  if (!Number.isInteger(count) || count < 1 || count > 100) return json({ error: 'Въведете валиден цял брой участници.' }, 400, headers);
  if (!name || !email.includes('@') || !phone || body.agreeTerms !== true) return json({ error: 'Моля, попълнете задължителните полета и приемете условията.' }, 400, headers);

  const event = await env.DB.prepare('SELECT * FROM events WHERE slug = ? AND status = ?').bind(eventSlug, 'active').first();
  const ticket = await env.DB.prepare('SELECT * FROM ticket_types WHERE event_id = ? AND ticket_key = ? AND active = 1').bind(event?.id, ticketKey).first();
  if (!event || !ticket) return json({ error: 'Събитието или билетът не е наличен.' }, 404, headers);

  if (count > event.capacity) return json({ error: 'Броят участници надвишава капацитета на събитието.' }, 409, headers);

  const promoCode = clean(body.promoCode, 50).toUpperCase() || null;
  let amount = ticket.price_cents * count;
  if (promoCode) {
    const promo = await env.DB.prepare('SELECT * FROM promo_codes WHERE event_id = ? AND code = ? AND active = 1').bind(event.id, promoCode).first();
    if (!promo) return json({ error: 'Невалиден промокод.' }, 400, headers);
    const allowed = JSON.parse(promo.ticket_keys_json || '[]');
    if (allowed.length && !allowed.includes(ticketKey)) return json({ error: 'Промокодът не важи за избрания билет.' }, 400, headers);
    amount = promo.discount_type === 'percent' ? Math.round(amount * (100 - promo.discount_value) / 100) : Math.max(0, amount - promo.discount_value * count);
  }

  const orderId = id('order');
  const created = now();
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const attendees = Array.isArray(body.attendees) && body.attendees.length ? body.attendees : [{ fullName: name, email, phone }];
  if (attendees.length < count || attendees.slice(0, count).some((attendee) => !clean(attendee.fullName, 120) || !clean(attendee.email, 160).includes('@') || !clean(attendee.phone, 40))) return json({ error: 'Моля, попълнете име, имейл и телефон за всеки участник.' }, 400, headers);
  const statements = [env.DB.prepare(`INSERT INTO orders (id,event_id,ticket_type_id,buyer_name,buyer_email,buyer_phone,attendee_count,promo_code,amount_cents,currency,status,payment_url,expires_at,created_at,updated_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,'pending_payment',NULL,?,?,? WHERE (SELECT COALESCE(SUM(attendee_count),0) FROM orders WHERE event_id = ? AND (status = 'paid' OR (status = 'pending_payment' AND expires_at > ?))) + ? <= ?`)
    .bind(orderId, event.id, ticket.id, name, email, phone, count, promoCode, amount, ticket.currency, expires, created, created, event.id, created, count, event.capacity)];
  for (let i = 0; i < count; i++) {
    const attendee = attendees[i] || {};
    statements.push(env.DB.prepare('INSERT INTO attendees (id, order_id, attendee_no, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id('att'), orderId, i + 1, clean(attendee.fullName || (i === 0 ? name : ''), 120), clean(attendee.email, 160).toLowerCase() || null, clean(attendee.phone, 40) || null));
  }
  for (const key of Array.isArray(body.masterClasses) ? body.masterClasses.slice(0, 6) : []) {
    statements.push(env.DB.prepare('INSERT OR IGNORE INTO order_masterclasses (order_id, masterclass_id) SELECT ?, id FROM masterclasses WHERE event_id = ? AND masterclass_key = ? AND active = 1').bind(orderId, event.id, clean(key, 50)));
  }
  const results = await env.DB.batch(statements);
  if (!results[0].meta?.changes) return json({ error: 'Свободните места за това събитие са изчерпани.' }, 409, headers);
  const paymentUrl = ticket.dsk_url || null;
  await env.DB.prepare('UPDATE orders SET payment_url = ? WHERE id = ?').bind(paymentUrl, orderId).run();
  return json({ orderId, status: 'pending_payment', amountCents: amount, currency: ticket.currency, paymentUrl, message: paymentUrl ? 'Продължете към защитената страница на ДСК.' : 'DSK payment link все още не е конфигуриран.' }, paymentUrl ? 201 : 202, headers);
}

async function dskWebhook(request, env, ctx) {
  const raw = await request.text();
  if (!(await verifySignature(raw, request.headers.get('X-DSK-Signature'), env.DSK_WEBHOOK_SECRET))) return json({ error: 'Invalid signature' }, 401, cors(request));
  const payload = JSON.parse(raw);
  const orderId = clean(payload.orderId || payload.order_id, 100);
  const status = clean(payload.status || payload.paymentStatus, 50).toLowerCase();
  const reference = clean(payload.transactionId || payload.transaction_id || payload.reference, 120);
  const eventId = id('payment');
  await env.DB.prepare('INSERT INTO payment_events (id,order_id,provider,provider_status,provider_reference,payload_hash,received_at) VALUES (?,?,?,?,?,?,?)')
    .bind(eventId, orderId, 'dsk', status, reference || null, await sha256(raw), now()).run();
  if (!['paid', 'success', 'successful', 'completed'].includes(status)) return json({ ok: true, status }, 200, cors(request));
  await finalizeOrder(orderId, reference, env, ctx);
  return json({ ok: true, status: 'paid' }, 200, cors(request));
}

async function finalizeOrder(orderId, reference, env, ctx) {
  const token = crypto.randomUUID();
  const updated = await env.DB.prepare("UPDATE orders SET status='paid', payment_reference=?, ticket_token=COALESCE(ticket_token,?), paid_at=COALESCE(paid_at,?), updated_at=? WHERE id=? AND status='pending_payment'")
    .bind(reference || null, token, now(), now(), orderId).run();
  const order = await env.DB.prepare('SELECT o.*, e.name event_name, e.starts_at, e.venue FROM orders o JOIN events e ON e.id=o.event_id WHERE o.id=?').bind(orderId).first();
  if (!order) return false;
  const attendees = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(orderId).all();
  const ticketUrl = `${env.PUBLIC_SITE_URL || ''}/api/tickets/${order.ticket_token}`;
  if (updated.meta?.changes) ctx.waitUntil(sendTicketEmail(env, order, attendees.results || [], { name: order.event_name }, ticketUrl));
  return true;
}

function ticketPage(order, attendees, event) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>Билет — ${html(event.name)}</title><style>body{font-family:Arial,sans-serif;background:#f4f7fc;color:#102653;padding:32px}.ticket{max-width:640px;margin:auto;background:#fff;border:1px solid #d6e0f2;border-radius:12px;padding:32px;box-shadow:0 12px 30px #10265318}h1{margin-top:0}.meta{line-height:1.8}.code{font:700 20px monospace;background:#eaf0fb;padding:12px;border-radius:8px;display:inline-block}</style><main class="ticket"><h1>${html(event.name)}</h1><p>Потвърден билет</p><div class="meta"><strong>Номер:</strong> ${html(order.id)}<br><strong>Дата:</strong> ${html(event.starts_at)}<br><strong>Място:</strong> ${html(event.venue)}<br><strong>Участници:</strong> ${(attendees.results || []).map((a) => html(clean(a.full_name))).join(', ')}</div><p class="code">${html(order.ticket_token)}</p><p>Покажете този билет при регистрация на събитието.</p></main>` , { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export default {
  async fetch(request, env, ctx) {
    const headers = cors(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/api/health') return json({ ok: true, service: 'sofiasummit-events-api' }, 200, headers);
      if (request.method === 'GET' && url.pathname.startsWith('/api/events/')) {
        const slug = decodeURIComponent(url.pathname.split('/').pop());
        const event = await env.DB.prepare('SELECT id,slug,name,starts_at,venue,capacity,status FROM events WHERE slug=?').bind(slug).first();
        if (!event) return json({ error: 'Not found' }, 404, headers);
        const tickets = await env.DB.prepare('SELECT ticket_key,name,price_cents,currency,active FROM ticket_types WHERE event_id=? AND active=1').bind(event.id).all();
        const used = await env.DB.prepare("SELECT COALESCE(SUM(attendee_count),0) total FROM orders WHERE event_id=? AND (status='paid' OR (status='pending_payment' AND expires_at > ?))").bind(event.id, now()).first();
        return json({ event, tickets: tickets.results || [], seatsRemaining: Math.max(0, event.capacity - Number(used.total || 0)) }, 200, headers);
      }
      if (request.method === 'POST' && url.pathname === '/api/orders') return createOrder(request, env);
      if (request.method === 'POST' && url.pathname === '/api/payments/dsk/webhook') return dskWebhook(request, env, ctx);
      if (request.method === 'GET' && url.pathname.startsWith('/api/tickets/')) {
        const token = clean(url.pathname.split('/').pop(), 100);
        const order = await env.DB.prepare("SELECT o.*,e.name event_name,e.starts_at,e.venue FROM orders o JOIN events e ON e.id=o.event_id WHERE o.ticket_token=? AND o.status='paid'").bind(token).first();
        if (!order) return new Response('Ticket not found', { status: 404 });
        const attendees = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(order.id).all();
        return ticketPage(order, attendees, { name: order.event_name, starts_at: order.starts_at, venue: order.venue });
      }
      if (url.pathname.startsWith('/api/admin/')) {
        const denied = requireAdmin(request, env); if (denied) return denied;
        if (request.method === 'GET' && url.pathname === '/api/admin/orders') {
          const status = clean(url.searchParams.get('status'), 40);
          const query = status ? 'SELECT o.*,e.name event_name,t.name ticket_name FROM orders o JOIN events e ON e.id=o.event_id JOIN ticket_types t ON t.id=o.ticket_type_id WHERE o.status=? ORDER BY o.created_at DESC' : 'SELECT o.*,e.name event_name,t.name ticket_name FROM orders o JOIN events e ON e.id=o.event_id JOIN ticket_types t ON t.id=o.ticket_type_id ORDER BY o.created_at DESC';
          const rows = status ? await env.DB.prepare(query).bind(status).all() : await env.DB.prepare(query).all();
          return json(rows.results || [], 200, headers);
        }
        if (request.method === 'GET' && url.pathname === '/api/admin/export.csv') {
          const rows = await env.DB.prepare('SELECT o.id,o.created_at,o.status,o.buyer_name,o.buyer_email,o.buyer_phone,o.attendee_count,o.promo_code,o.amount_cents,o.currency,e.name event_name,t.name ticket_name FROM orders o JOIN events e ON e.id=o.event_id JOIN ticket_types t ON t.id=o.ticket_type_id ORDER BY o.created_at DESC').all();
          const fields = ['id','created_at','status','buyer_name','buyer_email','buyer_phone','attendee_count','promo_code','amount_cents','currency','event_name','ticket_name'];
          const csv = [fields.join(','), ...(rows.results || []).map((row) => fields.map((field) => JSON.stringify(row[field] ?? '')).join(','))].join('\n');
          return new Response(csv, { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="registrations.csv"' } });
        }
        if (request.method === 'POST' && /^\/api\/admin\/orders\/[^/]+\/status$/.test(url.pathname)) {
          const orderId = url.pathname.split('/')[4];
          const body = await request.json();
          const nextStatus = clean(body.status, 30);
          if (!['paid', 'cancelled', 'refunded'].includes(nextStatus)) return json({ error: 'Invalid status' }, 400, headers);
          if (nextStatus === 'paid') await finalizeOrder(orderId, clean(body.paymentReference, 120), env, ctx);
          else await env.DB.prepare('UPDATE orders SET status=?, updated_at=? WHERE id=?').bind(nextStatus, now(), orderId).run();
          return json({ ok: true }, 200, headers);
        }
        if (request.method === 'POST' && /^\/api\/admin\/orders\/[^/]+\/resend-ticket$/.test(url.pathname)) {
          const orderId = url.pathname.split('/')[4];
          const order = await env.DB.prepare("SELECT o.*,e.name event_name,e.starts_at,e.venue FROM orders o JOIN events e ON e.id=o.event_id WHERE o.id=? AND o.status='paid'").bind(orderId).first();
          if (!order) return json({ error: 'Paid order not found' }, 404, headers);
          const attendees = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(orderId).all();
          const ticketUrl = `${env.PUBLIC_SITE_URL || ''}/api/tickets/${order.ticket_token}`;
          return json(await sendTicketEmail(env, order, attendees.results || [], { name: order.event_name }, ticketUrl), 200, headers);
        }
        if (request.method === 'POST' && url.pathname === '/api/admin/events/clone') {
          const body = await request.json();
          const source = await env.DB.prepare('SELECT * FROM events WHERE slug=?').bind(clean(body.sourceSlug, 80)).first();
          const newSlug = clean(body.newSlug, 80).toLowerCase();
          if (!source || !newSlug || !clean(body.name, 160) || !clean(body.startsAt, 50)) return json({ error: 'Missing event data' }, 400, headers);
          const eventId = id('event');
          const created = now();
          const statements = [env.DB.prepare("INSERT INTO events (id,slug,name,starts_at,venue,capacity,status,retention_days,created_at,updated_at) VALUES (?,?,?,?,?,?,'draft',?,?,?)").bind(eventId, newSlug, clean(body.name, 160), clean(body.startsAt, 50), clean(body.venue || source.venue, 160), Math.max(1, Math.min(10000, Number(body.capacity || source.capacity))), source.retention_days, created, created)];
          const tickets = await env.DB.prepare('SELECT * FROM ticket_types WHERE event_id=?').bind(source.id).all();
          for (const ticket of tickets.results || []) statements.push(env.DB.prepare('INSERT INTO ticket_types (id,event_id,ticket_key,name,price_cents,currency,dsk_url,active) VALUES (?,?,?,?,?,?,?,?)').bind(id('ticket'), eventId, ticket.ticket_key, ticket.name, ticket.price_cents, ticket.currency, '', ticket.active));
          const masterclasses = await env.DB.prepare('SELECT * FROM masterclasses WHERE event_id=?').bind(source.id).all();
          for (const masterclass of masterclasses.results || []) statements.push(env.DB.prepare('INSERT INTO masterclasses (id,event_id,masterclass_key,name,capacity,active) VALUES (?,?,?,?,?,?)').bind(id('mc'), eventId, masterclass.masterclass_key, masterclass.name, masterclass.capacity, masterclass.active));
          await env.DB.batch(statements);
          return json({ ok: true, slug: newSlug, status: 'draft' }, 201, headers);
        }
      }
      return json({ error: 'Not found' }, 404, headers);
    } catch (error) {
      console.error(error);
      return json({ error: 'Възникна техническа грешка. Моля, опитайте отново.' }, 500, headers);
    }
  }
};
