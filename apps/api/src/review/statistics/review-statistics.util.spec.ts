import { computeJournalingStreak, computeStatistics } from './review-statistics.util';
import type { ReviewUserData } from '../review.types';

describe('computeJournalingStreak', () => {
  const asOf = new Date('2026-01-10T12:00:00.000Z');

  it('counts consecutive days ending on asOf', () => {
    expect(computeJournalingStreak(['2026-01-10', '2026-01-09', '2026-01-08'], asOf)).toBe(3);
  });

  it('is zero when asOf’s own day has no entry — never assumes "today" without real evidence', () => {
    expect(computeJournalingStreak(['2026-01-09', '2026-01-08'], asOf)).toBe(0);
  });

  it('stops at the first gap', () => {
    expect(computeJournalingStreak(['2026-01-10', '2026-01-09', '2026-01-07'], asOf)).toBe(2);
  });

  it('is zero for no journal days at all', () => {
    expect(computeJournalingStreak([], asOf)).toBe(0);
  });
});

function makeUserData(overrides: Partial<ReviewUserData> = {}): ReviewUserData {
  const windowStart = new Date('2026-01-01T00:00:00.000Z');
  const windowEnd = new Date('2026-01-07T23:59:59.999Z');
  return {
    userId: 'user-1',
    windowStart,
    windowEnd,
    asOf: windowEnd,
    insights: [],
    looseReflections: [],
    achievementMemories: [],
    pinnedJournalEntries: [],
    counts: { journalCount: 0, memoryCreatedCount: 0, reflectionCount: 0, insightCount: 0, activityCount: 0, companionConversationCount: 0 },
    journalDays: [],
    ...overrides,
  };
}

describe('computeStatistics', () => {
  it('copies real counts verbatim and computes the streak from journalDays/asOf', () => {
    const data = makeUserData({
      counts: { journalCount: 5, memoryCreatedCount: 2, reflectionCount: 3, insightCount: 1, activityCount: 4, companionConversationCount: 7 },
      journalDays: ['2026-01-07'],
      asOf: new Date('2026-01-07T23:59:59.999Z'),
    });
    const stats = computeStatistics(data);
    expect(stats).toEqual({
      journalCount: 5,
      memoryCreatedCount: 2,
      reflectionCount: 3,
      insightCount: 1,
      activityCount: 4,
      journalingStreakDays: 1,
      companionConversationCount: 7,
    });
  });

  it('anchors the streak on asOf, not windowEnd — an in-progress period’s future windowEnd never has entries yet', () => {
    const futureWindowEnd = new Date('2026-01-31T23:59:59.999Z');
    const realAsOf = new Date('2026-01-15T00:00:00.000Z');
    const data = makeUserData({ windowEnd: futureWindowEnd, asOf: realAsOf, journalDays: ['2026-01-15'] });
    expect(computeStatistics(data).journalingStreakDays).toBe(1);
  });
});
