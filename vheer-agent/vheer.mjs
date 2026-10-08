import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const RESULT_RE = /access\.vheer\.com\/results\/[^?]+\.(mp4|webm|mov)/i;
const IMG_RE = /access\.vheer\.com\/results\/[^?]+\.(jpg|jpeg|png|webp)/i;

export async function launch() {
  return chromium.launch({
    executablePath: CHROMIUM,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
}

async function newCtx(browser) {
  const state = fs.existsSync(process.env.AUTH_STATE || 'auth.json') ? (process.env.AUTH_STATE || 'auth.json') : undefined;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 }, storageState: state });
  await ctx.route('**/*', (route) => {
    const h = new URL(route.request().url()).hostname;
    return h === 'vheer.com' || h.endsWith('.vheer.com') ? route.continue() : route.abort();
  });
  return ctx;
}

async function pickOption(page, buttonText, optionText) {
  await page.getByRole('button', { name: buttonText, exact: true }).first().click();
  await page.getByText(optionText, { exact: true }).last().click({ timeout: 8000 });
}

async function download(ctx, url, dest) {
  const r = await ctx.request.get(url, { timeout: 120000 });
  if (!r.ok()) throw new Error(`download ${r.status()} ${url}`);
  fs.writeFileSync(dest, await r.body());
  return dest;
}

export async function makeBaseImage(browser, prompt, dest, log = () => {}) {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  try {
    await page.goto('https://vheer.com/app/text-to-image', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('textarea').first().waitFor({ timeout: 30000 });
    await pickOption(page, '1:1', '16:9');
    await page.locator('textarea').first().fill(prompt);
    const wait = page.waitForResponse((r) => IMG_RE.test(r.url()), { timeout: 240000 }).catch(() => null);
    await page.getByRole('button', { name: /^Generate/ }).first().click();
    let url = (await wait)?.url();
    if (!url) {
      await page.waitForFunction(() => [...document.images].some((i) => /access\.vheer\.com\/results/.test(i.src)), null, { timeout: 120000 });
      url = await page.evaluate(() => [...document.images].find((i) => /access\.vheer\.com\/results/.test(i.src)).src);
    }
    log(`base image: ${url}`);
    return await download(ctx, url, dest);
  } finally {
    await ctx.close();
  }
}

export async function makeVideo(browser, imagePath, prompt, dest, { duration = '5s', model = '', log = () => {} } = {}) {
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  try {
    await page.goto('https://vheer.com/app/image-to-video', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('textarea').first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(3000);
    if (model) {
      await page.getByRole('button', { name: /Vheer Quality|SeeDance|LTX Video|Veo|Sora|Hailuo/ }).first().click();
      await page.waitForTimeout(800);
      const opt = page.getByText(model, { exact: false }).first();
      await opt.scrollIntoViewIfNeeded();
      await opt.click({ timeout: 10000 });
      await page.waitForTimeout(1200);
      log('model ' + model + ' | ' + (await page.getByRole('button', { name: /^Generate/ }).first().innerText()).replace(/\n+/g, ' '));
    }
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 20000 }),
      page.getByRole('button', { name: 'Select Images' }).click(),
    ]);
    await fc.setFiles(imagePath);
    await page.getByRole('button', { name: 'Select Images' }).waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});
    log('image attached');
    await page.waitForTimeout(1500);
    await page.locator('textarea').first().fill(prompt);
    if (duration !== '5s') await pickOption(page, '5s', duration).catch(() => {});
    const wait = page.waitForResponse((r) => RESULT_RE.test(r.url()), { timeout: 420000 }).catch(() => null);
    await page.getByRole('button', { name: /^Generate/ }).first().click();
    let url = (await wait)?.url();
    if (!url) {
      await page.waitForFunction(
        () => [...document.querySelectorAll('video,source')].some((v) => /access\.vheer\.com\/results/.test(v.currentSrc || v.src || '')),
        null, { timeout: 180000 });
      url = await page.evaluate(() => {
        const v = [...document.querySelectorAll('video,source')].find((x) => /access\.vheer\.com\/results/.test(x.currentSrc || x.src || ''));
        return v.currentSrc || v.src;
      });
    }
    log(`video: ${url}`);
    return await download(ctx, url, dest);
  } finally {
    await ctx.close();
  }
}

export function probe(file) {
  return new Promise((resolve) => {
    import('node:child_process').then(({ execFile }) => {
      execFile('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration,size', '-of', 'json', file],
        (err, out) => {
          if (err) return resolve({ ok: false, error: String(err.message).slice(0, 200) });
          try {
            const j = JSON.parse(out);
            const s = j.streams?.[0] || {};
            resolve({ ok: true, width: s.width, height: s.height, duration: Number(j.format?.duration), size: Number(j.format?.size) });
          } catch (e) { resolve({ ok: false, error: 'parse' }); }
        });
    });
  });
}
