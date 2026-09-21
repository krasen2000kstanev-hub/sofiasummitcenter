// deployment marker: 2026-09-17
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import arialFont from '../assets/arial.ttf';

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
    headers: { 'WWW-Authenticate': 'Basic realm="Sofia Summit admin"', ...cors(request) }
  });
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json();
  const form = await request.formData();
  const attendeesCount = Number(form.get('attendeesCount') ?? 1);
  const attendees = [{ fullName: form.get('fullName'), email: form.get('email'), phone: form.get('phone') }];
  for (let i = 2; Number.isInteger(attendeesCount) && attendeesCount <= 10000 && i <= attendeesCount; i++) attendees.push({
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

const EVENT_ADDRESS = 'ул. „8-ми декември“ № 13, София, България';

const transliterate = (value) => String(value ?? '').replace(/[А-Яа-яЁё]/g, (character) => ({
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ж: 'Zh', З: 'Z', И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Sht', Ъ: 'A', Ь: 'Y', Ю: 'Yu', Я: 'Ya',
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya', Ё: 'Yo', ё: 'yo'
}[character] || character)).replace(/[^\x20-\x7E]/g, '?');

const pdfEscape = (value) => transliterate(value).replace(/([\\()])/g, '\\$1');
const pdfText = (value, x, y, size, color = '0 0 0') => `BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET\n`;
const pdfRect = (x, y, width, height, color) => `${color} rg ${x} ${y} ${width} ${height} re f\n`;
const asciiBytes = (value) => new TextEncoder().encode(value);

function concatBytes(...parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function buildPdf(content) {
  const contentObject = asciiBytes(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const objects = [
    asciiBytes('<< /Type /Catalog /Pages 2 0 R >>'),
    asciiBytes('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    asciiBytes('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'),
    asciiBytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
    contentObject
  ];
  const header = asciiBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const chunks = [header];
  const offsets = [0];
  let offset = header.length;
  objects.forEach((object, index) => {
    const chunk = concatBytes(asciiBytes(`${index + 1} 0 obj\n`), object, asciiBytes('\nendobj\n'));
    offsets.push(offset);
    chunks.push(chunk);
    offset += chunk.length;
  });
  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index++) xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(asciiBytes(xref));
  return concatBytes(...chunks);
}

function base64(bytes) {
  let output = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) output += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return btoa(output);
}

async function fetchQrJpeg(env, ticketUrl) {
  const base = env.QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/';
  const separator = base.includes('?') ? '&' : '?';
  const response = await fetch(`${base}${separator}size=300x300&format=jpg&data=${encodeURIComponent(ticketUrl)}`);
  if (!response.ok) throw new Error(`QR renderer returned ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function generateTicketPdf(env, order, attendee, event, ticketUrl) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(new Uint8Array(arialFont), { subset: true });
  const page = pdf.addPage([595, 842]);
  const cream = rgb(0.98, 0.97, 0.95);
  const blue = rgb(0.294, 0.494, 0.796);
  const green = rgb(0.188, 0.302, 0.09);
  const black = rgb(0.02, 0.02, 0.02);
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: cream });
  page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: blue });
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 62, color: green });
  const centered = (text, y, size, color = black) => page.drawText(String(text), { x: (595 - font.widthOfTextAtSize(String(text), size)) / 2, y, size, font, color });
  const paragraph = (values, y, size, leading) => values.forEach((value, index) => centered(value, y - index * leading, size));
  centered('NAIL BUSINESS RE:START', 810, 17, rgb(1, 1, 1));
  centered('София, 26 Октомври 2026', 785, 11, rgb(1, 1, 1));
  centered('ПОКАЖИ ТОЗИ БИЛЕТ НА ВХОДА', 724, 20);
  centered('РЕГИСТРАЦИЯ ПОТВЪРДЕНА', 685, 17);
  centered(`ИМЕ НА УЧАСТНИКА: ${attendee.full_name}`, 648, 11);
  centered(`ВИД БИЛЕТ: ${event.ticket_name || 'Билет'}`, 626, 11);
  centered(`НОМЕР НА ПОРЪЧКА: ${order.id}`, 604, 11);
  centered(`ДАТА: ${new Date(event.starts_at || '').toLocaleDateString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'long' })}`, 566, 11);
  centered('ЧАС: 09:00 ч.', 544, 11);
  centered(`МЯСТО: ${event.venue}`, 522, 11);
  centered(`АДРЕС: ${EVENT_ADDRESS}`, 500, 10);
  paragraph(['Не пропускайте най-важното', 'събитие за развитие на вашия', 'бизнес в нокътната индустрия!'], 420, 16, 23);
  paragraph(['Очакваме ви на NAIL BUSINESS RE:START, за да стартираме заедно', 'новата ера във вашия успех. Срещаме се с водещи експерти,', 'обменяме ценен опит и откриваме иновативни стратегии за растеж.'], 330, 9, 16);
  centered('#NAILBUSINESSRESTART', 276, 10);
  centered('© NAIL BUSINESS RE:START 2026. Всички права запазени.', 35, 8, rgb(1, 1, 1));
  centered('Този имейл е генериран автоматично. Моля, не отговаряйте на него.', 20, 7, rgb(1, 1, 1));
  return pdf.save();
}

async function sendAttendeeTicketEmail(env, order, attendee, event, force = false) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { status: 'skipped', attendeeId: attendee.id };
  const recipient = clean(attendee.email, 160).toLowerCase() || order.buyer_email;
  const existing = await env.DB.prepare("SELECT status FROM email_log WHERE order_id=? AND attendee_id=? AND email_type='ticket'").bind(order.id, attendee.id).first();
  if (!force && existing?.status === 'sent') return { status: 'already_sent', attendeeId: attendee.id };
  const ticketUrl = `${env.PUBLIC_SITE_URL || ''}/api/tickets/${attendee.ticket_token}`;
  let pdf;
  try { pdf = await generateTicketPdf(env, order, attendee, event, ticketUrl); }
  catch (error) {
    await env.DB.prepare("INSERT OR REPLACE INTO email_log (id, order_id, attendee_id, recipient, email_type, provider_id, status, sent_at) VALUES (?,?,?,?,?,?,?,?)")
      .bind(id('email'), order.id, attendee.id, recipient, 'ticket', null, 'failed', now()).run();
    console.error('[ticket-pdf]', error);
    return { status: 'failed', attendeeId: attendee.id };
  }
  const message = `<h1>${html(event.name)}</h1><p>Здравейте, ${html(attendee.full_name)}!</p><p>Регистрацията и плащането са потвърдени.</p><p><strong>Вид билет:</strong> ${html(event.ticket_name || 'Билет')}</p><p><a href="${html(ticketUrl)}">Отвори онлайн билета</a></p><p>Покажете приложения PDF билет на входа.</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [recipient], subject: `Билет за ${event.name}`, html: message, attachments: [{ filename: `ticket-${attendee.ticket_token}.pdf`, content: base64(pdf) }] })
  });
  const result = await response.json().catch(() => ({}));
  await env.DB.prepare("INSERT OR REPLACE INTO email_log (id, order_id, attendee_id, recipient, email_type, provider_id, status, sent_at) VALUES (?,?,?,?,?,?,?,?)")
    .bind(id('email'), order.id, attendee.id, recipient, 'ticket', result.id || null, response.ok ? 'sent' : 'failed', now()).run();
  return { status: response.ok ? 'sent' : 'failed', providerId: result.id || null, attendeeId: attendee.id };
}

async function sendTicketEmails(env, order, attendees, event, force = false) {
  const results = [];
  for (const attendee of attendees) results.push(await sendAttendeeTicketEmail(env, order, attendee, event, force));
  return results;
}

async function quotePromo(request, env) {
  const headers = cors(request);
  const body = await readBody(request);
  const event = await env.DB.prepare('SELECT id FROM events WHERE slug=? AND status=?').bind(clean(body.eventSlug || 'nail-business-restart', 80), 'active').first();
  const ticket = await env.DB.prepare('SELECT price_cents,currency,ticket_key FROM ticket_types WHERE event_id=? AND ticket_key=? AND active=1').bind(event?.id, clean(body.ticketType || 'standard', 50)).first();
  const count = Math.max(1, Math.min(100, Number(body.attendeesCount || 1)));
  const code = clean(body.promoCode, 50).toUpperCase();
  if (!event || !ticket || !code) return json({ error: 'Невалиден промокод.' }, 400, headers);
  const promo = await env.DB.prepare('SELECT * FROM promo_codes WHERE event_id=? AND code=? AND active=1').bind(event.id, code).first();
  if (!promo) return json({ error: 'Невалиден промокод.' }, 400, headers);
  const allowed = JSON.parse(promo.ticket_keys_json || '[]');
  if (allowed.length && !allowed.includes(ticket.ticket_key)) return json({ error: 'Промокодът не важи за избрания билет.' }, 400, headers);
  const percent = count > 1 ? Number(promo.group_discount_percent || promo.discount_value) : Number(promo.single_discount_percent || promo.discount_value);
  return json({ valid: true, code, discountPercent: percent, amountCents: Math.round(ticket.price_cents * count * (100 - percent) / 100), currency: ticket.currency }, 200, headers);
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
  if (!Number.isInteger(count) || count < 1 || count > 10000) return json({ error: 'Въведете валиден цял брой участници.' }, 400, headers);
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
  await env.DB.prepare("UPDATE orders SET status='paid', payment_reference=?, ticket_token=COALESCE(ticket_token,?), paid_at=COALESCE(paid_at,?), updated_at=? WHERE id=? AND status='pending_payment'")
    .bind(reference || null, token, now(), now(), orderId).run();
  const order = await env.DB.prepare('SELECT o.*, e.name event_name, e.starts_at, e.venue, t.name ticket_name FROM orders o JOIN events e ON e.id=o.event_id JOIN ticket_types t ON t.id=o.ticket_type_id WHERE o.id=?').bind(orderId).first();
  if (!order) return false;
  const attendees = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(orderId).all();
  for (const attendee of attendees.results || []) {
    if (!attendee.ticket_token) await env.DB.prepare('UPDATE attendees SET ticket_token=? WHERE id=? AND ticket_token IS NULL').bind(crypto.randomUUID(), attendee.id).run();
  }
  const ticketRows = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(orderId).all();
  ctx.waitUntil(sendTicketEmails(env, order, ticketRows.results || [], { name: order.event_name, starts_at: order.starts_at, venue: order.venue, ticket_name: order.ticket_name }));
  return true;
}

function ticketPage(order, attendee, event) {
  const used = Boolean(attendee.checked_in_at);
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Билет — ${html(event.name)}</title><style>:root{--ink:#0b0b0d;--paper:#faf8f5;--cyan:#1e8cae;--orange:#e2542a}body{font-family:Arial,sans-serif;background:var(--ink);color:#17151a;padding:24px}.ticket{max-width:640px;margin:auto;background:var(--paper);border-top:8px solid var(--cyan);border-bottom:4px solid var(--orange);padding:32px;box-shadow:0 12px 30px #0005}h1{margin:0 0 12px;font-size:28px;color:var(--ink)}.status{color:var(--cyan);font-weight:700;letter-spacing:.08em}.meta{line-height:1.9;margin-top:24px}.code{font:700 16px monospace;background:#eaf6fa;padding:12px;border-radius:4px;display:inline-block;word-break:break-all}.used{color:var(--orange);font-weight:700}</style><main class="ticket"><h1>${html(event.name)}</h1><p class="status">${used ? 'БИЛЕТЪТ Е ВЕЧЕ ИЗПОЛЗВАН' : 'РЕГИСТРАЦИЯ ПОТВЪРДЕНА'}</p><div class="meta"><strong>Участник:</strong> ${html(attendee.full_name)}<br><strong>Билет:</strong> ${html(event.ticket_name || 'Билет')}<br><strong>Дата:</strong> ${html(event.starts_at)}<br><strong>Място:</strong> ${html(event.venue)}<br><strong>Адрес:</strong> ${html(EVENT_ADDRESS)}<br><strong>Поръчка:</strong> ${html(order.id)}</div><p class="code">${html(attendee.ticket_token)}</p>${used ? `<p class="used">Чекиран на ${html(attendee.checked_in_at)}</p>` : '<p>Покажете този билет при регистрация на събитието.</p>'}</main>` , { headers: { 'content-type': 'text/html; charset=utf-8' } });
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
      if (request.method === 'POST' && url.pathname === '/api/promo/quote') return quotePromo(request, env);
      if (request.method === 'POST' && url.pathname === '/api/payments/dsk/webhook') return dskWebhook(request, env, ctx);
      if (request.method === 'GET' && url.pathname.startsWith('/api/tickets/')) {
        const token = clean(url.pathname.split('/').pop(), 100);
        const row = await env.DB.prepare("SELECT o.*,a.*,e.name event_name,e.starts_at,e.venue,t.name ticket_name FROM attendees a JOIN orders o ON o.id=a.order_id JOIN events e ON e.id=o.event_id JOIN ticket_types t ON t.id=o.ticket_type_id WHERE a.ticket_token=? AND o.status='paid'").bind(token).first();
        if (!row) return new Response('Ticket not found', { status: 404 });
        return ticketPage(row, row, { name: row.event_name, starts_at: row.starts_at, venue: row.venue, ticket_name: row.ticket_name });
      }
      if (url.pathname.startsWith('/api/admin/')) {
        const denied = requireAdmin(request, env); if (denied) return denied;
        if (request.method === 'POST' && /^\/api\/admin\/tickets\/[^/]+\/check-in$/.test(url.pathname)) {
          const token = clean(url.pathname.split('/')[4], 100);
          const updated = await env.DB.prepare("UPDATE attendees SET checked_in_at=? WHERE ticket_token=? AND checked_in_at IS NULL AND order_id IN (SELECT id FROM orders WHERE status='paid')").bind(now(), token).run();
          if (updated.meta?.changes) return json({ ok: true, status: 'checked_in', token }, 200, headers);
          const attendee = await env.DB.prepare('SELECT checked_in_at FROM attendees WHERE ticket_token=?').bind(token).first();
          if (attendee?.checked_in_at) return json({ ok: false, status: 'already_checked_in', checkedInAt: attendee.checked_in_at }, 409, headers);
          return json({ error: 'Ticket not found or unpaid' }, 404, headers);
        }
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
          const order = await env.DB.prepare("SELECT o.*,e.name event_name,e.starts_at,e.venue,t.name ticket_name FROM orders o JOIN events e ON e.id=o.event_id JOIN ticket_types t ON t.id=o.ticket_type_id WHERE o.id=? AND o.status='paid'").bind(orderId).first();
          if (!order) return json({ error: 'Paid order not found' }, 404, headers);
          const attendees = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(orderId).all();
          for (const attendee of attendees.results || []) {
            if (!attendee.ticket_token) await env.DB.prepare('UPDATE attendees SET ticket_token=? WHERE id=? AND ticket_token IS NULL').bind(crypto.randomUUID(), attendee.id).run();
          }
          const refreshed = await env.DB.prepare('SELECT * FROM attendees WHERE order_id=? ORDER BY attendee_no').bind(orderId).all();
          return json(await sendTicketEmails(env, order, refreshed.results || [], { name: order.event_name, starts_at: order.starts_at, venue: order.venue, ticket_name: order.ticket_name }, true), 200, headers);
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
