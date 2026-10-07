import fs from 'node:fs';
import { launch, makeBaseImage } from './vheer.mjs';
const chars = JSON.parse(fs.readFileSync('chars.json'));
const b = await launch();
const log = (m) => console.log(new Date().toISOString().slice(11, 19), m);
for (const c of chars) {
  const dest = `out/chars/${c.id}.jpg`;
  if (fs.existsSync(dest) && fs.statSync(dest).size > 50000) continue;
  for (let t = 1; t <= 2; t++) {
    try { await makeBaseImage(b, c.prompt, dest, () => {}); log('OK ' + c.id); break; }
    catch (e) { log('FAIL ' + c.id + ' try ' + t + ' ' + e.message.split('\n')[0]); }
  }
}
await b.close(); log('DONE');
