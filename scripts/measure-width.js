#!/usr/bin/env node
/* 宽度质量门：每个语言页 fresh-load 后量 document.documentElement.scrollWidth === innerWidth。
   两档视口：1440（桌面）/ 390（手机）。CJK 长词换行最容易爆横滚，5 语言全测。
   用法： NODE_PATH=/Users/damo/gstack/node_modules node scripts/measure-width.js [baseURL]
   依赖 playwright（复用 gstack 安装；无 remote，只在 Mac 本机跑）。 */
import { chromium } from '/Users/damo/gstack/node_modules/playwright/index.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const LOCALES = ['en', 'zh', 'ja', 'ko', 'fr'];
const WIDTHS = [1440, 390];

const browser = await chromium.launch({ headless: true });
let fail = 0;
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  for (const lc of LOCALES) {
    const url = lc === 'en' ? `${BASE}/` : `${BASE}/${lc}/`;
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);   // 首帧渲染 + rAF 首渲完成
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
      bh: document.body ? document.body.scrollHeight : 0,
      lang: document.documentElement.lang,
    }));
    const ok = m.sw === m.iw;
    if (!ok) fail++;
    console.log(`${ok ? '✓' : '✗'} ${w}x  /${lc === 'en' ? '' : lc + '/'}  scrollWidth=${m.sw} innerWidth=${m.iw}  lang=${m.lang}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(fail ? `💥 ${fail} 处横滚溢出` : '🎉 全部语言 × 两档视口 fresh-load 无横滚');
process.exit(fail ? 1 : 0);
