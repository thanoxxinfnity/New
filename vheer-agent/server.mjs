import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import { launch, makeBaseImage, makeVideo, probe } from './vheer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const MIN_BYTES = 500 * 1024;
const MAX_TRIES = 3;
const SUFFIX = 'hand-drawn 2D anime style, smooth fluid animation, static camera, no text';
fs.mkdirSync(DATA, { recursive: true });

const jobs = new Map();
let browserP = null;
const getBrowser = () => (browserP ??= launch());
let queue = Promise.resolve();

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

async function nvidiaImage(key, prompt, dest) {
  const r = await fetch('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width: 1344, height: 768, seed: 0, steps: 28, cfg_scale: 3.5, mode: 'base' }),
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) throw new Error(`NVIDIA ${r.status}`);
  const j = await r.json();
  fs.writeFileSync(dest, Buffer.from(j.artifacts[0].base64, 'base64'));
  return dest;
}

async function runJob(job) {
  const browser = await getBrowser();
  const dir = path.join(DATA, job.id);
  fs.mkdirSync(dir, { recursive: true });
  job.status = 'running';
  const bases = {};
  for (const ch of job.characters) {
    const dest = path.join(dir, `base_${slug(ch.id)}.jpg`);
    if (ch.imageB64) {
      fs.writeFileSync(dest, Buffer.from(ch.imageB64, 'base64'));
      bases[ch.id] = dest;
      job.log.push(`base ${ch.id}: uploaded`);
      continue;
    }
    for (let t = 1; t <= MAX_TRIES && !bases[ch.id]; t++) {
      try {
        if (job.nvidiaKey && t === 1) {
          bases[ch.id] = await nvidiaImage(job.nvidiaKey, ch.prompt, dest);
          job.log.push(`base ${ch.id}: NVIDIA FLUX`);
        } else {
          bases[ch.id] = await makeBaseImage(browser, ch.prompt, dest, (m) => job.log.push(m));
          job.log.push(`base ${ch.id}: vheer text-to-image`);
        }
      } catch (e) {
        job.log.push(`base ${ch.id} try ${t} failed: ${e.message}`);
      }
    }
  }
  for (const ch of job.characters) {
    for (const m of job.motions) {
      const name = `${slug(m.category)}_${String(m.n).padStart(2, '0')}_${slug(m.name)}_${slug(ch.id)}.mp4`;
      const item = { name, character: ch.id, status: 'queued', tries: 0 };
      job.items.push(item);
      if (!bases[ch.id]) { item.status = 'failed'; item.error = 'no base image'; continue; }
      for (let t = 1; t <= MAX_TRIES; t++) {
        item.tries = t;
        item.status = 'generating';
        const dest = path.join(dir, name);
        try {
          await makeVideo(browser, bases[ch.id], `${m.prompt}, ${SUFFIX}`, dest, { duration: job.duration, log: (x) => job.log.push(x) });
          const info = await probe(dest);
          Object.assign(item, info);
          if (!info.ok) throw new Error('ffprobe failed');
          if (info.size < MIN_BYTES) throw new Error(`too small ${info.size}`);
          if (!(info.width > info.height)) throw new Error(`not landscape ${info.width}x${info.height}`);
          item.status = 'done';
          break;
        } catch (e) {
          item.status = 'retry';
          item.error = e.message;
          job.log.push(`${name} try ${t}: ${e.message}`);
          fs.rmSync(dest, { force: true });
          if (t === MAX_TRIES) item.status = 'failed';
        }
      }
    }
  }
  job.status = 'finished';
}

function listText(job) {
  const rows = job.items.filter((i) => i.status === 'done')
    .map((i) => `${i.name}\t${(i.size / 1024 / 1024).toFixed(2)} MB\t${i.width}x${i.height}\t${i.duration.toFixed(1)}s`);
  return ['file\tsize\tresolution\tduration', ...rows].join('\n') + '\n';
}

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((ok, bad) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > 40e6) { bad(new Error('too big')); req.destroy(); } }); req.on('end', () => ok(b)); });
const pub = (j) => ({ id: j.id, status: j.status, duration: j.duration, items: j.items, total: j.total, log: j.log.slice(-15) });

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(__dirname, 'public', 'index.html')));
    }
    if (req.method === 'POST' && u.pathname === '/api/jobs') {
      const b = JSON.parse(await readBody(req));
      if (!b.motions?.length || !b.characters?.length) return json(res, 400, { error: 'characters and motions required' });
      const job = { id: crypto.randomBytes(5).toString('hex'), status: 'queued', items: [], log: [],
        characters: b.characters, motions: b.motions, duration: b.duration || '5s', nvidiaKey: b.nvidiaKey || '',
        total: b.characters.length * b.motions.length };
      jobs.set(job.id, job);
      queue = queue.then(() => runJob(job)).catch((e) => { job.status = 'error'; job.log.push(String(e.message)); });
      return json(res, 200, { id: job.id });
    }
    const m = u.pathname.match(/^\/api\/jobs\/([a-f0-9]+)(\/zip|\/list)?$/);
    if (m && jobs.has(m[1])) {
      const job = jobs.get(m[1]);
      if (!m[2]) return json(res, 200, pub(job));
      if (m[2] === '/list') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(listText(job)); }
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="anime_videos_${job.id}.zip"` });
      const z = archiver('zip', { zlib: { level: 0 } });
      z.pipe(res);
      for (const i of job.items.filter((x) => x.status === 'done')) z.file(path.join(DATA, job.id, i.name), { name: i.name });
      z.append(listText(job), { name: 'videos_list.txt' });
      return z.finalize();
    }
    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
}).listen(PORT, () => console.log(`vheer-agent on :${PORT}`));
