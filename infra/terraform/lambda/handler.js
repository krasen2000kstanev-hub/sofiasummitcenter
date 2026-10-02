const crypto = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESv2Client({});
const TABLE = process.env.TABLE_NAME;
const EVENT_ID = 'career-cafe';
const ORIGIN = process.env.FRONTEND_ORIGIN || 'https://sofiasummit.bg';

const TICKETS = Object.freeze({
  espresso: { name: 'Espresso', priceCents: 1200, paymentUrl: process.env.DSK_ESPRESSO_URL || '', parkingPaymentUrl: process.env.DSK_ESPRESSO_PARKING_URL || '' },
  doppio: { name: 'Doppio', priceCents: 2400, paymentUrl: process.env.DSK_DOPPIO_URL || '', parkingPaymentUrl: process.env.DSK_DOPPIO_PARKING_URL || '' },
  lungo: { name: 'Lungo+', priceCents: 3600, paymentUrl: process.env.DSK_LUNGO_URL || '', parkingPaymentUrl: process.env.DSK_LUNGO_PARKING_URL || '' }
});
const PARKING_CENTS = 500;
const DISCOUNT_CENTS = 600;
const TICKET_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function calculatePrice(ticketKey, eligible, parking) {
  const ticket = TICKETS[ticketKey];
  if (!ticket) throw new Error('Unknown ticket');
  return { baseAmountCents: ticket.priceCents, discountCents: eligible ? DISCOUNT_CENTS : 0, parkingCents: parking ? PARKING_CENTS : 0, amountCents: ticket.priceCents - (eligible ? DISCOUNT_CENTS : 0) + (parking ? PARKING_CENTS : 0) };
}

const response = (statusCode, body, extra = {}) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': ORIGIN, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization,x-dsk-signature', ...extra },
  body: JSON.stringify(body)
});
const htmlResponse = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': ORIGIN }, body });

const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const normalizeName = (value) => text(value, 160).toLocaleLowerCase('bg-BG').replace(/\s+/g, ' ');
const html = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const encodedSubject = (value) => `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
const now = () => new Date().toISOString();
const id = () => `cc_${crypto.randomUUID()}`;
const randomTicketCode = () => Array.from({ length: 4 }, () => TICKET_CODE_ALPHABET[crypto.randomInt(TICKET_CODE_ALPHABET.length)]).join('');
const inquiryRecipients = (value = process.env.INQUIRY_NOTIFY_EMAILS) => String(value || '').split(',').map((email) => email.trim().toLowerCase()).filter((email) => /^\S+@\S+\.\S+$/.test(email));

function method(event) { return event.requestContext?.http?.method || event.httpMethod || 'GET'; }
function path(event) { return event.rawPath || event.path || '/'; }
function parseBody(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '{}';
  return JSON.parse(raw);
}
function adminAuthorized(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  return Boolean(process.env.ADMIN_TOKEN && header === `Bearer ${process.env.ADMIN_TOKEN}`);
}

async function discountNames() {
  const result = await db.send(new GetCommand({ TableName: TABLE, Key: { id: `CONFIG#${EVENT_ID}` }, ProjectionExpression: 'discountNames' }));
  return Array.isArray(result.Item?.discountNames) ? result.Item.discountNames.map(normalizeName) : [];
}

async function calculate(input) {
  const ticket = TICKETS[text(input.ticket, 20).toLocaleLowerCase()];
  const name = text(input.name, 160);
  const email = text(input.email, 254).toLowerCase();
  const formerPosition = text(input.formerPosition, 160);
  const need = text(input.need, 500);
  const parking = input.parking === true;
  if (!ticket || !name || !formerPosition || !need || !/^\S+@\S+\.\S+$/.test(email) || input.agreeTerms !== true) return { error: 'Моля, попълнете правилно всички задължителни полета.' };
  const eligible = (await discountNames()).includes(normalizeName(name));
  const ticketKey = text(input.ticket, 20).toLocaleLowerCase();
  return { ticketKey, ticket, name, email, formerPosition, need, parking, eligible, ...calculatePrice(ticketKey, eligible, parking) };
}

async function createRegistration(event) {
  let input;
  try { input = parseBody(event); } catch { return response(400, { error: 'Невалиден JSON.' }); }
  const calculated = await calculate(input);
  if (calculated.error) return response(400, { error: calculated.error });
  const orderId = id();
  const item = {
    id: `REGISTRATION#${orderId}`, type: 'registration', eventId: EVENT_ID, orderId,
    name: calculated.name, email: calculated.email, formerPosition: calculated.formerPosition, need: calculated.need,
    ticketKey: calculated.ticketKey, ticketName: calculated.ticket.name, parking: calculated.parking,
    baseAmountCents: calculated.ticket.priceCents, discountCents: calculated.discountCents,
    parkingCents: calculated.parkingCents, amountCents: calculated.amountCents, currency: 'EUR',
    status: 'pending_payment', createdAt: now(), expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90
  };
  await db.send(new PutCommand({ TableName: TABLE, Item: item, ConditionExpression: 'attribute_not_exists(id)' }));
  return response(201, {
    ok: true, orderId, amountCents: item.amountCents, currency: item.currency,
    discountCents: item.discountCents, parkingCents: item.parkingCents,
    paymentUrl: (calculated.parking ? calculated.ticket.parkingPaymentUrl : calculated.ticket.paymentUrl) || null,
    parkingPaymentUrl: null,
    message: 'Регистрацията е записана. Продължете към плащане.'
  });
}

async function verifyDsk(raw, signature) {
  if (!process.env.DSK_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', process.env.DSK_WEBHOOK_SECRET).update(raw).digest('hex');
  const received = signature.replace(/^sha256=/, '').toLowerCase();
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

async function newTicketCode() {
  // ponytail: four characters keeps the guest experience simple; increase length if ticket volume grows substantially.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomTicketCode();
    if (!(await findByTicketToken(code))) return code;
  }
  throw new Error('Не успях да генерирам свободен код за билет.');
}

async function markPaid(orderId, reference) {
  const result = await db.send(new GetCommand({ TableName: TABLE, Key: { id: `REGISTRATION#${orderId}` } }));
  const item = result.Item;
  if (!item) return { error: 'Регистрацията не е намерена.', statusCode: 404 };
  if (item.status === 'paid') return { item, alreadyPaid: true };
  if (item.status !== 'pending_payment') return { error: 'Регистрацията не е в очакване на плащане.', statusCode: 409 };
  const ticketToken = await newTicketCode();
  try {
    await db.send(new UpdateCommand({
      TableName: TABLE, Key: { id: item.id },
      UpdateExpression: 'SET #status=:paid, paymentReference=:reference, ticketToken=:token, paidAt=:paidAt, updatedAt=:updatedAt',
      ConditionExpression: '#status=:pending',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':paid': 'paid', ':pending': 'pending_payment', ':reference': reference || null, ':token': ticketToken, ':paidAt': now(), ':updatedAt': now() }
    }));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return { item: { ...item, status: 'paid' }, alreadyPaid: true };
    throw error;
  }
  return { item: { ...item, status: 'paid', ticketToken }, alreadyPaid: false };
}

function mimePart(contentType, content, extra = '') { return `Content-Type: ${contentType}${extra}\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${content}\r\n`; }
function buildRawEmail(item, ticketUrl) {
  const boundary = `cc_${crypto.randomUUID()}`;
  const htmlBody = `<h2>Вашият билет за Кариерно кафе</h2><p>Здравейте, ${html(item.name)}!</p><p><b>Код за вход:</b> <strong style="font-size:28px;letter-spacing:6px">${html(item.ticketToken)}</strong></p><p><b>Билет:</b> ${html(item.ticketName)}<br><b>Бивша позиция:</b> ${html(item.formerPosition)}${item.need ? `<br><b>От какво има нужда:</b> ${html(item.need)}` : ''}<br><b>Паркинг:</b> ${item.parking ? 'Да' : 'Не'}<br><b>Крайна сума:</b> ${(item.amountCents / 100).toFixed(2)} €</p><p>Покажете този код на входа.</p><p>Резервен линк: <a href="${html(ticketUrl)}">Проверка на билета</a></p><p>Sofia Summit Center, ул. „8-ми декември“ №13, София<br>21 ноември 2026 г., 09:30–17:00 ч.</p>`;
  const textBody = `Вашият билет за Кариерно кафе\n\nКод за вход: ${item.ticketToken}\n\nИмена: ${item.name}\nБилет: ${item.ticketName}\nБивша позиция: ${item.formerPosition}${item.need ? `\nОт какво има нужда: ${item.need}` : ''}\nПаркинг: ${item.parking ? 'Да' : 'Не'}\nКрайна сума: ${(item.amountCents / 100).toFixed(2)} EUR\n\nПроверка: ${ticketUrl}`;
  return [
    `From: ${process.env.EMAIL_FROM}\r\nTo: ${item.email}\r\nSubject: ${encodedSubject('Вашият билет за Кариерно кафе')}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`,
    `--${boundary}\r\n${mimePart('text/plain; charset=UTF-8', textBody)}--${boundary}\r\n${mimePart('text/html; charset=UTF-8', htmlBody)}--${boundary}--\r\n`
  ].join('');
}

async function sendTicketEmail(item) {
  if (!process.env.EMAIL_FROM || item.emailStatus === 'sent') return false;
  const ticketUrl = `${process.env.PUBLIC_API_URL.replace(/\/$/, '')}/tickets/${encodeURIComponent(item.ticketToken)}`;
  const result = await ses.send(new SendEmailCommand({ FromEmailAddress: process.env.EMAIL_FROM, Destination: { ToAddresses: [item.email] }, Content: { Raw: { Data: Buffer.from(buildRawEmail(item, ticketUrl)) } } }));
  await db.send(new UpdateCommand({ TableName: TABLE, Key: { id: item.id }, UpdateExpression: 'SET emailStatus=:status, emailSentAt=:sentAt, emailMessageId=:messageId', ExpressionAttributeValues: { ':status': 'sent', ':sentAt': now(), ':messageId': result.MessageId || null } }));
  return true;
}

async function dskWebhook(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  if (!(await verifyDsk(raw, event.headers?.['x-dsk-signature'] || event.headers?.['X-DSK-Signature']))) return response(401, { error: 'Невалиден DSK подпис.' });
  let payload; try { payload = JSON.parse(raw); } catch { return response(400, { error: 'Невалиден webhook.' }); }
  const status = text(payload.status || payload.paymentStatus, 40).toLowerCase();
  const orderId = text(payload.orderId || payload.order_id, 100);
  if (!orderId) return response(400, { error: 'Липсва orderId.' });
  if (!['paid', 'success', 'successful', 'completed'].includes(status)) return response(200, { ok: true, status });
  const result = await markPaid(orderId, text(payload.transactionId || payload.transaction_id || payload.reference, 120));
  if (result.error) return response(result.statusCode, { error: result.error });
  if (!result.alreadyPaid || result.item.emailStatus !== 'sent') await sendTicketEmail(result.item);
  return response(200, { ok: true, status: 'paid' });
}

async function ticket(event, token) {
  const item = await findByTicketToken(token);
  if (!item || item.status !== 'paid' || item.ticketToken !== token) return htmlResponse(404, '<!doctype html><meta charset="utf-8"><title>Невалиден билет</title><h1>Билетът не е намерен или не е платен.</h1>');
  const checkedIn = Boolean(item.checkedInAt);
  return htmlResponse(200, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Проверка на билет</title><style>body{font:18px system-ui;max-width:560px;margin:48px auto;padding:0 20px;color:#241a10}main{border:2px solid #b97a3f;padding:28px;border-radius:12px}h1{color:${checkedIn ? '#9b2c2c' : '#356b35'}}p{line-height:1.5}</style><main><h1>${checkedIn ? 'Билетът вече е използван' : 'Валиден билет'}</h1><p><b>Име:</b> ${html(item.name)}</p><p><b>Билет:</b> ${html(item.ticketName)}</p>${item.need ? `<p><b>От какво има нужда:</b> ${html(item.need)}</p>` : ''}<p><b>Паркинг:</b> ${item.parking ? 'Да' : 'Не'}</p></main>`);
}

async function findByTicketToken(token) {
  // ponytail: table scan is enough for one event; add a ticketToken GSI if volume grows.
  const result = await db.send(new ScanCommand({ TableName: TABLE, FilterExpression: 'ticketToken = :token', ExpressionAttributeValues: { ':token': token } }));
  return result.Items?.[0] || null;
}

async function adminMarkPaid(event, orderId) {
  if (!adminAuthorized(event)) return response(401, { error: 'Неоторизиран достъп.' });
  let body = {}; try { body = parseBody(event); } catch {}
  const result = await markPaid(orderId, text(body.paymentReference, 120) || 'manual');
  if (result.error) return response(result.statusCode, { error: result.error });
  if (!result.alreadyPaid || result.item.emailStatus !== 'sent') await sendTicketEmail(result.item);
  return response(200, { ok: true, status: 'paid', emailSent: true });
}

async function checkIn(event, token) {
  if (!adminAuthorized(event)) return response(401, { error: 'Неоторизиран достъп.' });
  const item = await findByTicketToken(token);
  if (!item) return response(404, { error: 'Билетът не е намерен.' });
  try {
    const result = await db.send(new UpdateCommand({ TableName: TABLE, Key: { id: item.id }, UpdateExpression: 'SET checkedInAt=:at', ConditionExpression: '#status=:paid AND attribute_not_exists(checkedInAt)', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':paid': 'paid', ':at': now() }, ReturnValues: 'ALL_NEW' }));
    return response(200, { ok: true, status: 'checked_in', name: result.Attributes?.name, ticket: result.Attributes?.ticketName });
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return response(409, { ok: false, status: 'already_checked_in' });
    throw error;
  }
}

async function createInquiry(event) {
  let input;
  try { input = parseBody(event); } catch { return response(400, { error: 'Невалиден JSON.' }); }
  const inquiry = {
    name: text(input.name, 120), email: text(input.email, 254).toLowerCase(), phone: text(input.phone, 40),
    space: text(input.space, 80), requestedDate: text(input.date || input.requested_date, 10), guests: Number(input.guests || 0), message: text(input.message, 2000)
  };
  if (!inquiry.name || !/^\S+@\S+\.\S+$/.test(inquiry.email) || !inquiry.phone || !inquiry.space || !/^\d{4}-\d{2}-\d{2}$/.test(inquiry.requestedDate) || !Number.isInteger(inquiry.guests) || inquiry.guests < 1 || inquiry.guests > 150) return response(400, { error: 'Моля, попълнете правилно всички полета.' });
  const item = { id: `INQUIRY#${crypto.randomUUID()}`, type: 'inquiry', status: 'pending', createdAt: now(), name: inquiry.name, email: inquiry.email, phone: inquiry.phone, space: inquiry.space, requestedDate: inquiry.requestedDate, guests: inquiry.guests, message: inquiry.message };
  await db.send(new PutCommand({ TableName: TABLE, Item: item, ConditionExpression: 'attribute_not_exists(id)' }));
  let emailSent = false;
  const recipients = inquiryRecipients();
  if (process.env.EMAIL_FROM && recipients.length) try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: process.env.EMAIL_FROM,
      Destination: { ToAddresses: recipients },
      Content: { Simple: {
        Subject: { Data: `Ново запитване — ${inquiry.space}`, Charset: 'UTF-8' },
        Body: { Text: { Data: `Име: ${inquiry.name}\nИмейл: ${inquiry.email}\nТелефон: ${inquiry.phone}\nПространство: ${inquiry.space}\nДата: ${inquiry.requestedDate}\nГости: ${inquiry.guests}\n\n${inquiry.message}`, Charset: 'UTF-8' } }
      } }
    }));
    emailSent = true;
  } catch (error) { console.error('Inquiry notification failed', error); }
  return response(201, { ok: true, inquiry_id: item.id, status: item.status, email_sent: emailSent });
}

async function availability(event) {
  const space = text(event.queryStringParameters?.space, 80);
  if (!space) return response(400, { error: 'Липсва пространство.' });
  const result = await db.send(new ScanCommand({ TableName: TABLE, FilterExpression: '#type = :type AND #space = :space AND #status = :status', ExpressionAttributeNames: { '#type': 'type', '#space': 'space', '#status': 'status' }, ExpressionAttributeValues: { ':type': 'inquiry', ':space': space, ':status': 'confirmed' }, ProjectionExpression: 'requestedDate' }));
  return response(200, { space, occupied_dates: (result.Items || []).map((item) => item.requestedDate).filter(Boolean) });
}

exports.handler = async (event) => {
  if (method(event) === 'OPTIONS') return response(204, {});
  try {
    const route = path(event);
    if (method(event) === 'GET' && route === '/availability') return availability(event);
    if (method(event) === 'POST' && route === '/inquiries') return createInquiry(event);
    if (method(event) === 'POST' && route === '/registrations') return createRegistration(event);
    if (method(event) === 'POST' && route === '/payments/dsk/webhook') return dskWebhook(event);
    if (method(event) === 'GET' && route.startsWith('/tickets/')) return ticket(event, decodeURIComponent(route.split('/').pop()));
    if (method(event) === 'POST' && route.startsWith('/admin/orders/') && route.endsWith('/mark-paid')) return adminMarkPaid(event, route.split('/')[3]);
    if (method(event) === 'POST' && route.startsWith('/admin/tickets/') && route.endsWith('/check-in')) return checkIn(event, decodeURIComponent(route.split('/')[3]));
    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    return response(500, { error: 'Възникна техническа грешка.' });
  }
};

exports.calculatePrice = calculatePrice;
exports.inquiryRecipients = inquiryRecipients;
