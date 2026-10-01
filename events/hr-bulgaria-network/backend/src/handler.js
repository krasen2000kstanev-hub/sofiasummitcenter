const crypto = require('node:crypto');
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand
} = require('@aws-sdk/client-dynamodb');
const {SESv2Client, SendEmailCommand} = require('@aws-sdk/client-sesv2');
const {validateRegistration} = require('./validation');

const db = new DynamoDBClient({});
const ses = new SESv2Client({});
const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {'content-type': 'application/json; charset=utf-8', ...headers},
  body: JSON.stringify(body)
});
const cors = () => ({
  'access-control-allow-origin': process.env.ALLOWED_ORIGIN,
  'access-control-allow-headers': 'content-type,x-dsk-signature',
  'access-control-allow-methods': 'GET,POST,OPTIONS'
});
const id = () => crypto.randomUUID();
const ticketCode = () => crypto.randomBytes(3).toString('base64url').replace(/[-_]/g, '').slice(0, 4);
const now = () => Math.floor(Date.now() / 1000);

function eventConfig() {
  return JSON.parse(process.env.EVENT_CONFIG_JSON || '{}');
}

function eventBody(ticketCode) {
  const event = eventConfig();
  const speakers = (event.speakers || []).map((speaker) => `${speaker.name} (${speaker.company}) — ${speaker.topic}`).join('\n');
  return `Здравейте,\n\nПлащането за HR Bulgaria Network е потвърдено.\n\nВашият код: ${ticketCode}\n\nСъбитие: ${event.title}\nДата: ${event.date}\nЧас: ${event.time}\nМясто: ${event.venue}\nАдрес: ${event.address}\n\nЛектори:\n${speakers}\n\nПовече информация: ${event.url}`;
}

function verifyWebhook(rawBody, signature) {
  const secret = process.env.DSK_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  signature = signature.replace(/^sha256=/i, '');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function requestPath(event) {
  return event.rawPath || event.requestContext?.http?.path || event.path || '/';
}

async function createRegistration(body) {
  const {data, errors} = validateRegistration(body || {});
  if (Object.keys(errors).length) return json(400, {errors}, cors());

  const registrationId = id();
  const expiresAt = now() + Number(process.env.REGISTRATION_TTL_SECONDS || 2592000);
  await db.send(new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: {
      registrationId: {S: registrationId},
      ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, {S: Array.isArray(value) ? JSON.stringify(value) : String(value)}])),
      paymentStatus: {S: 'pending'},
      emailStatus: {S: 'not_sent'},
      createdAt: {N: String(now())},
      expiresAt: {N: String(expiresAt)}
    },
    ConditionExpression: 'attribute_not_exists(registrationId)'
  }));
  return json(201, {registrationId, paymentUrl: process.env.PAYMENT_LINK}, cors());
}

async function handleWebhook(event) {
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  if (!verifyWebhook(rawBody, event.headers?.['x-dsk-signature'] || event.headers?.['X-DSK-Signature'])) return json(401, {error: 'Invalid webhook signature'}, cors());

  const payload = JSON.parse(rawBody);
  const registrationId = payload.registrationId || payload.orderId || payload.merchantReference;
  const status = String(payload.status || payload.paymentStatus || '').toLowerCase();
  if (!registrationId || !['paid', 'success', 'successful', 'failed', 'cancelled'].includes(status)) return json(400, {error: 'Unsupported payment payload'}, cors());

  const current = await db.send(new GetItemCommand({TableName: process.env.TABLE_NAME, Key: {registrationId: {S: registrationId}}}));
  if (!current.Item) return json(404, {error: 'Registration not found'}, cors());
  const paymentStatus = ['paid', 'success', 'successful'].includes(status) ? 'paid' : 'failed';
  if (paymentStatus === 'failed') {
    await db.send(new UpdateItemCommand({TableName: process.env.TABLE_NAME, Key: {registrationId: {S: registrationId}}, UpdateExpression: 'SET paymentStatus = :status, paymentReference = :reference', ExpressionAttributeValues: {':status': {S: 'failed'}, ':reference': {S: String(payload.transactionId || payload.reference || '')}}}));
    return json(200, {ok: true}, cors());
  }

  const code = ticketCode();
  try {
    await db.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {registrationId: {S: registrationId}},
      UpdateExpression: 'SET paymentStatus = :paid, ticketCode = :code, paymentReference = :reference, paidAt = :paidAt',
      ConditionExpression: 'attribute_not_exists(emailStatus) OR emailStatus <> :sent',
      ExpressionAttributeValues: {':paid': {S: 'paid'}, ':code': {S: code}, ':reference': {S: String(payload.transactionId || payload.reference || '')}, ':paidAt': {N: String(now())}, ':sent': {S: 'sent'}}
    }));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return json(200, {ok: true, duplicate: true}, cors());
    throw error;
  }

  const email = current.Item.email?.S;
  const name = current.Item.name?.S || 'участник';
  const body = eventBody(code);
  await ses.send(new SendEmailCommand({
    FromEmailAddress: process.env.FROM_EMAIL,
    Destination: {ToAddresses: [email, process.env.ORGANIZER_EMAIL].filter(Boolean)},
    Content: {Simple: {Subject: {Data: 'Потвърден билет за HR Bulgaria Network', Charset: 'UTF-8'}, Body: {Text: {Data: body.replace('Здравейте,', `Здравейте, ${name},`), Charset: 'UTF-8'}}}}
  }));
  await db.send(new UpdateItemCommand({TableName: process.env.TABLE_NAME, Key: {registrationId: {S: registrationId}}, UpdateExpression: 'SET emailStatus = :sent, emailSentAt = :sentAt', ExpressionAttributeValues: {':sent': {S: 'sent'}, ':sentAt': {N: String(now())}}}));
  return json(200, {ok: true}, cors());
}

exports.handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
    if (method === 'OPTIONS') return {statusCode: 204, headers: cors(), body: ''};
    const path = requestPath(event);
    if (method === 'GET' && path.endsWith('/event')) return json(200, eventConfig(), cors());
    if (method === 'POST' && path.endsWith('/registrations')) return createRegistration(JSON.parse(event.body || '{}'));
    if (method === 'POST' && path.endsWith('/payments/dsk/webhook')) return handleWebhook(event);
    return json(404, {error: 'Not found'}, cors());
  } catch (error) {
    console.error(error);
    return json(500, {error: 'Възникна временен проблем.'}, cors());
  }
};
