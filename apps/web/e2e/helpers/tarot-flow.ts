import { expect, type Page, type Response } from '@playwright/test';
import type { TarotReadingDto, TarotReadingTypeValue } from '@beaconvie/types';

export const tarotDrawSection = (page: Page) => page.getByRole('region', { name: 'Trải bài Tarot', exact: true });
const LABELS = { DAILY_DRAW: 'Daily Draw', SINGLE_CARD: 'Single Card', THREE_CARD: 'Three Card Spread' };

/** Exercise the current UI, including the real backend request. No cards or API results are mocked. */
export async function requestTarotDraw(page: Page, type: TarotReadingTypeValue, question = '', fromSpread = false): Promise<Response> {
  const section = tarotDrawSection(page);
  if (!fromSpread) await section.getByRole('button', { name: 'Bắt đầu trải bài' }).click();
  await section.getByRole('button', { name: new RegExp(LABELS[type]) }).click();
  await section.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await section.getByRole('button', { name: /Tổng quan/ }).click();
  await section.getByLabel('Câu hỏi của bạn (không bắt buộc)').fill(question);
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === '/tarot/draw' && response.request().method() === 'POST');
  await section.getByRole('button', { name: 'Tập trung và xáo bài' }).click();
  const response = await responsePromise;
  expect(response.request().postDataJSON()).toEqual({ type, ...(type !== 'DAILY_DRAW' && question ? { question } : {}) });
  return response;
}

export async function revealTarotDraw(page: Page, response: Response): Promise<TarotReadingDto> {
  expect(response.ok()).toBe(true);
  const { data: reading } = await response.json() as { data: TarotReadingDto };
  const section = tarotDrawSection(page);
  await expect(section.getByRole('heading', { name: 'Chọn lá bài úp' })).toBeVisible();
  expect(new Set(reading.cards.map((entry) => entry.card.id)).size).toBe(reading.cards.length);
  for (let i = 1; i <= reading.cards.length; i++) {
    await section.getByRole('button', { name: `Chọn lá ${i}`, exact: true }).click();
  }
  // Wait through the real reveal; do not assume a fixed duration or restore the old Draw UI.
  await expect(section.getByRole('button', { name: 'Rút trải bài khác' })).toBeVisible({ timeout: 15000 });
  for (const entry of reading.cards) {
    await expect(section.getByRole('heading', { name: entry.card.name, exact: true })).toBeVisible();
  }
  await expect(section.locator('[aria-label^="Orientation "]')).toHaveCount(reading.cards.length);
  return reading;
}
