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

  // All API responses below are explicit QA fixtures, not production persistence.
  const card = {
    arcana: 'MAJOR', imageSlug: 'major-the-star', name: 'The Star',
    nameVi: 'Ngôi Sao', uprightMeaning: 'Hy vọng và sự hồi phục.',
    reversedMeaning: 'Cần tìm lại niềm tin.', uprightKeywords: ['Hy vọng'],
    reversedKeywords: ['Hoài nghi'], loveMeaning: 'Lắng nghe trái tim.',
    careerMeaning: 'Kiên nhẫn với con đường.', financeMeaning: 'Cân nhắc lâu dài.',
    selfMeaning: 'Chăm sóc bản thân.', reflectionPrompts: ['Điều gì cho bạn hy vọng?']
  };
  const reading = (id, positions, type = 'SINGLE_CARD') => ({
    id, type, question: null, interpretation: 'Hãy dành thời gian lắng nghe chính mình.',
    cards: positions.map((p, i) => ({
      position: i, positionLabel: type === 'THREE_CARD' ? ['Quá khứ','Hiện tại','Tương lai'][i] : 'Thông điệp',
      isReversed: false, card: { ...card, name: 'The Star ' + (p + 1) }
    }))
  });
  let currentReading = reading('qa-reading-1', [0]);
  const drawCalls = [];
  await page.route('**/tarot/draw', async route => {
    const payload = route.request().postDataJSON();
    drawCalls.push(payload);
    currentReading = reading('qa-reading-' + drawCalls.length, payload.selectedPositions, payload.type);
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: currentReading, meta: {}, requestId: 'qa-draw' }) });
  });
  await cards.first().click();
  await page.getByText('Diễn giải trải bài').waitFor({ timeout: 20000 });
  await page.screenshot({ path: path.resolve('../../tarot-mobile-evidence/tarot-mobile-result-390-fixture.png'), fullPage: true });
  if (drawCalls.length !== 1 || drawCalls[0].selectedPositions.length !== 1) throw new Error('Single draw payload invalid');

  await page.getByText('Rút trải bài khác').click();
  await page.getByText('Ba lá', { exact: true }).click();
  await page.getByText('Xáo bài và bắt đầu').click();
  await page.getByText('Chọn 3 lá').waitFor();
  const three = page.getByLabel(/^Lá úp /);
  await three.nth(0).click();
  await three.nth(0).click({ force: true }).catch(() => {});
  await three.nth(12).click();
  if (drawCalls.length !== 1) throw new Error('Three-card draw submitted before third distinct card');
  await three.nth(77).click();
  await page.getByText('Diễn giải trải bài').waitFor();
  if (drawCalls.length !== 2 || new Set(drawCalls[1].selectedPositions).size !== 3)
    throw new Error('Three-card draw must contain 3 distinct positions');
  await page.screenshot({ path: path.resolve('../../tarot-mobile-evidence/tarot-mobile-three-card-result-390-fixture.png'), fullPage: true });

  await page.getByText('Rút trải bài khác').click();
  await page.getByText('Một lá', { exact: true }).click();
  await page.getByText('Xáo bài và bắt đầu').click();
  await page.route('**/tarot/draw', async route => route.fulfill({
    status: 409, contentType: 'application/json',
    body: JSON.stringify({ data: null, error: { code: 'TAROT_SELECTION_SESSION_USED', message: 'Token đã sử dụng' }, meta: {}, requestId: 'qa-error' })
  }));
  await page.getByLabel('Lá úp 2').click();
  await page.getByText(/Vui lòng xáo bài để thử lại/).waitFor({ timeout: 15000 });
  await page.getByText('Xáo bài và bắt đầu').waitFor();
  const retryVisible = await page.getByText('Xáo bài và bắt đầu').isVisible();

  await page.route('**/tarot/readings?**', async route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { items: [currentReading], total: 1, page: 1, pageSize: 20 }, meta: {}, requestId: 'qa-history' })
  }));
  await page.route('**/tarot/readings/qa-reading-2', async route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: currentReading, meta: {}, requestId: 'qa-open-history' })
  }));
  await page.getByText('Tải lịch sử').click();
  await page.getByText('Trải bài đã lưu').first().waitFor();
  await page.getByText('Trải bài đã lưu').first().click();
  await page.getByText('Diễn giải trải bài').waitFor();
  await page.screenshot({ path: path.resolve('../../tarot-mobile-evidence/tarot-mobile-history-result-390-fixture.png'), fullPage: true });
  fs.writeFileSync(path.resolve('../../tarot-mobile-evidence/functional-qa.json'),
    JSON.stringify({ fixtureOnly: true, singleDraw: drawCalls[0], threeCardDraw: drawCalls[1],
      uniqueThreePositions: new Set(drawCalls[1].selectedPositions).size === 3,
      usedTokenRetryVisible: retryVisible, historyReopened: true, errors }, null, 2));
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
