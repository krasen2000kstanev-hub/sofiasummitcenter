const crypto = require('node:crypto');
const { DynamoDBClient, TransactWriteItemsCommand, PutItemCommand, ScanCommand, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const db = new DynamoDBClient({});
const ses = new SESv2Client({});
const tableName = process.env.TABLE_NAME;
const eventId = 'nail-business-restart';
const capacity = 100;
const response = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';

exports.handler = async (event) => {
  const path = event.rawPath || '/';
  if (path === '/admin/inquiries') return adminInquiries(event);
  if (event.requestContext?.http?.method === 'GET' && path === '/availability') {
    const space = text(event.queryStringParameters?.space, 80);
    if (!space) return response(400, { error: 'Липсва пространство.' });
    const result = await db.send(new ScanCommand({ TableName: tableName, FilterExpression: '#type = :type AND #space = :space AND #status = :status', ExpressionAttributeNames: { '#type': 'type', '#space': 'space', '#status': 'status' }, ExpressionAttributeValues: { ':type': { S: 'inquiry' }, ':space': { S: space }, ':status': { S: 'confirmed' } }, ProjectionExpression: 'requested_date' }));
    return response(200, { space, occupied_dates: (result.Items || []).map((item) => item.requested_date.S).filter(Boolean) });
  }
  if (path === '/inquiries') return createInquiry(event);
  if (path !== '/registrations') return response(404, { error: 'Not found' });
  let input;
  try { input = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : event.body || '{}'); }
  catch { return response(400, { error: 'Invalid JSON' }); }

  const registration = {
    full_name: text(input.full_name || input.name, 120), email: text(input.email, 254).toLowerCase(),
    phone: text(input.phone, 40), promo_code: text(input.promo_code, 50),
    participants_count: Number(input.participants_count || input.participants || 1),
    ticket_type: text(input.ticket_type, 50),
    masterclasses: Array.isArray(input.masterclasses) ? input.masterclasses.map((x) => text(x, 160)).slice(0, 10) : [],
    terms_accepted: input.terms_accepted === true
  };
  if (!registration.full_name || !registration.email || !registration.phone || !registration.ticket_type ||
      !Number.isInteger(registration.participants_count) || registration.participants_count < 1 || registration.participants_count > capacity ||
      !registration.terms_accepted || !/^\S+@\S+\.\S+$/.test(registration.email)) {
    return response(400, { error: 'Моля, попълнете правилно всички задължителни полета.' });
  }

  const id = crypto.randomUUID();
  const item = {
    id: { S: `reservation#${id}` }, type: { S: 'reservation' }, event: { S: eventId },
    created_at: { S: new Date().toISOString() }, payment_status: { S: 'not_configured' },
    full_name: { S: registration.full_name }, email: { S: registration.email }, phone: { S: registration.phone },
    promo_code: { S: registration.promo_code }, participants_count: { N: String(registration.participants_count) },
    ticket_type: { S: registration.ticket_type }, masterclasses: { SS: registration.masterclasses.length ? registration.masterclasses : ['none'] },
    terms_accepted: { BOOL: true }
  };
  try {
    await db.send(new TransactWriteItemsCommand({ TransactItems: [
      { Update: { TableName: tableName, Key: { id: { S: `event#${eventId}` } },
        UpdateExpression: 'SET registered_count = if_not_exists(registered_count, :zero) + :count, event = :event',
        ConditionExpression: 'attribute_not_exists(registered_count) OR registered_count <= :max_before',
        ExpressionAttributeValues: { ':zero': { N: '0' }, ':count': { N: String(registration.participants_count) }, ':max_before': { N: String(capacity - registration.participants_count) }, ':event': { S: eventId } } } },
      { Put: { TableName: tableName, Item: item, ConditionExpression: 'attribute_not_exists(id)' } }
    ] }));
  } catch (error) {
    if (error.name === 'TransactionCanceledException') return response(409, { error: 'Няма достатъчно свободни места.' });
    return response(500, { error: 'Резервацията не можа да бъде записана.' });
  }

  let emailSent = false;
  try {
    await ses.send(new SendEmailCommand({ FromEmailAddress: process.env.EMAIL_FROM, Destination: { ToAddresses: [registration.email] }, Content: { Simple: {
      Subject: { Data: 'Успешна регистрация — Nail Business Restart', Charset: 'UTF-8' },
      Body: { Text: { Data: `Здравейте, ${registration.full_name}!\n\nПолучихме вашата регистрация за Nail Business Restart.\nНомер: ${id}\n\nПлащането ще бъде добавено допълнително.`, Charset: 'UTF-8' } }
    } } }));
    emailSent = true;
  } catch {}
  return response(201, { ok: true, reservation_id: id, payment_status: 'not_configured', email_sent: emailSent });
};

async function createInquiry(event) {
  let input;
  try { input = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : event.body || '{}'); } catch { return response(400, { error: 'Invalid JSON' }); }
  const inquiry = { name: text(input.name, 120), email: text(input.email, 254).toLowerCase(), phone: text(input.phone, 40), space: text(input.space, 80), requested_date: text(input.date || input.requested_date, 10), guests: Number(input.guests || 0), message: text(input.message, 2000) };
  if (!inquiry.name || !/^\S+@\S+\.\S+$/.test(inquiry.email) || !inquiry.phone || !inquiry.space || !/^\d{4}-\d{2}-\d{2}$/.test(inquiry.requested_date) || !Number.isInteger(inquiry.guests) || inquiry.guests < 1 || inquiry.guests > 100) return response(400, { error: 'Моля, попълнете правилно всички полета.' });
  const id = crypto.randomUUID();
  await db.send(new PutItemCommand({ TableName: tableName, Item: { id: { S: `inquiry#${id}` }, type: { S: 'inquiry' }, status: { S: 'pending' }, created_at: { S: new Date().toISOString() }, name: { S: inquiry.name }, email: { S: inquiry.email }, phone: { S: inquiry.phone }, space: { S: inquiry.space }, requested_date: { S: inquiry.requested_date }, guests: { N: String(inquiry.guests) }, message: { S: inquiry.message } }, ConditionExpression: 'attribute_not_exists(id)' }));
  let emailSent = false;
  if (process.env.INQUIRY_NOTIFY_EMAIL && process.env.EMAIL_FROM) try {
    await ses.send(new SendEmailCommand({ FromEmailAddress: process.env.EMAIL_FROM, Destination: { ToAddresses: [process.env.INQUIRY_NOTIFY_EMAIL] }, Content: { Simple: {
      Subject: { Data: `Ново запитване — ${inquiry.space}`, Charset: 'UTF-8' },
      Body: { Text: { Data: `Име: ${inquiry.name}\nИмейл: ${inquiry.email}\nТелефон: ${inquiry.phone}\nПространство: ${inquiry.space}\nДата: ${inquiry.requested_date}\nГости: ${inquiry.guests}\n\n${inquiry.message}`, Charset: 'UTF-8' }
    } } } }));
    emailSent = true;
  } catch {}
  return response(201, { ok: true, inquiry_id: id, status: 'pending', email_sent: emailSent });
}

async function adminInquiries(event) {
  const auth = event.headers?.authorization || '';
  const expected = 'Basic ' + Buffer.from(`${process.env.ADMIN_USER || ''}:${process.env.ADMIN_PASSWORD || ''}`).toString('base64');
  if (!process.env.ADMIN_USER || auth !== expected) return { statusCode: 401, headers: { 'content-type': 'application/json', 'www-authenticate': 'Basic realm="Sofia Summit"' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (event.requestContext?.http?.method === 'GET') {
    const result = await db.send(new ScanCommand({ TableName: tableName, FilterExpression: '#type = :type', ExpressionAttributeNames: { '#type': 'type' }, ExpressionAttributeValues: { ':type': { S: 'inquiry' } } }));
    return response(200, (result.Items || []).map((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'type').map(([k, v]) => [k, v.S ?? (v.N ? Number(v.N) : v.BOOL)]))));
  }
  const id = (event.pathParameters || {}).id || (event.rawPath || '').split('/').pop();
  let input; try { input = JSON.parse(event.body || '{}'); } catch { return response(400, { error: 'Invalid JSON' }); }
  if (!['confirmed', 'rejected'].includes(input.status) || !id) return response(400, { error: 'Невалиден статус.' });
  const existing = await db.send(new GetItemCommand({ TableName: tableName, Key: { id: { S: `inquiry#${id}` } } }));
  await db.send(new UpdateItemCommand({ TableName: tableName, Key: { id: { S: `inquiry#${id}` } }, UpdateExpression: 'SET #status = :status', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':status': { S: input.status } } }));
  let emailSent = false;
  const item = existing.Item || {};
  if (item.email?.S && process.env.EMAIL_FROM) try {
    const approved = input.status === 'confirmed';
    await ses.send(new SendEmailCommand({ FromEmailAddress: process.env.EMAIL_FROM, Destination: { ToAddresses: [item.email.S] }, Content: { Simple: {
      Subject: { Data: approved ? 'Запитването ви е потвърдено — Sofia Summit Center' : 'Относно вашето запитване — Sofia Summit Center', Charset: 'UTF-8' },
      Body: { Text: { Data: `Здравейте, ${item.name?.S || ''}!\n\n${approved ? `Потвърждаваме вашето запитване за ${item.space?.S || 'пространството'} на ${item.requested_date?.S || ''}.` : 'За съжаление не можем да потвърдим запитването за избраната дата.'}\n\nSofia Summit Center`, Charset: 'UTF-8' }
    } } } }));
    emailSent = true;
  } catch {}
  return response(200, { ok: true, status: input.status, email_sent: emailSent });
}
