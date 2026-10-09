const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/tarot/selection-session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { token: 'qa-fixture-once-only', deckSize: 78, expiresAt: '2099-01-01T00:00:00Z' },
        meta: {}, requestId: 'qa-fixture'
      })
    });
  });
  await page.goto('http://localhost:19006/tarot', { waitUntil: 'domcontentloaded' });
  await page.getByText('Xáo bài và bắt đầu').waitFor({ timeout: 45000 });
  await page.getByText('Xáo bài và bắt đầu').click();
  await page.getByText('Chọn 1 lá').waitFor({ timeout: 20000 });
  const cards = page.getByLabel(/^Lá úp /);
  const count = await cards.count();
  if (count !== 78) throw new Error('Expected 78 cards; got ' + count);
  await page.screenshot({ path: path.resolve('../../tarot-mobile-evidence/tarot-mobile-selection-390-fixture.png'), fullPage: true });
  fs.writeFileSync(path.resolve('../../tarot-mobile-evidence/selection-qa.json'), JSON.stringify({ cardCount: count, errors }, null, 2));
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
