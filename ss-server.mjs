import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = resolve('store-assets');

const server = http.createServer(async (req, res) => {
  try {
    // CORS for ASC origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = join(ROOT, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }

    const buf = await readFile(filePath);
    if (url.searchParams.get('md5') === '1') {
      const h = createHash('md5').update(buf).digest('hex');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ size: buf.length, md5: h }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buf.length });
    res.end(buf);
  } catch (e) {
    res.writeHead(404);
    res.end(String(e));
  }
});

server.listen(7731, '127.0.0.1', () => {
  console.log('Screenshot server: http://127.0.0.1:7731/');
});
