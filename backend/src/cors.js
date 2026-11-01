export const cors = (request) => ({
  'access-control-allow-origin': request.headers.get('Origin') || '*',
  'access-control-allow-methods': /^\/api\/hrr\/mentor\/missions\/[^/]+$/.test(new URL(request.url).pathname) ? 'GET,POST,PATCH,DELETE,OPTIONS' : 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization,x-dsk-signature,x-hrr-view',
  'access-control-max-age': '86400'
});
