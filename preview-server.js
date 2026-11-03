const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Pass a folder to preview it instead of the repository, e.g. `node preview-server.js _site`.
const root = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = requested.endsWith('/') ? `${requested}index.html` : requested;
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(8765, '127.0.0.1');
