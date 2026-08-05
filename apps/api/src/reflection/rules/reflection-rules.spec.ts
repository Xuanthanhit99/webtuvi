import {
  repeatedTopicRule,
  repeatedGoalRule,
  longInactivityRule,
  goalRegressionRule,
  positiveStreakRule,
  negativeStreakRule,
  repeatedJournalThemeRule,
  memoryJournalAlignmentRule,
  goalActivityMismatchRule,
} from './reflection-rules';
import { makeActivity, makeCompanionMessage, makeGoalConflict, makeJournal, makeMemory, makeUserData } from '../test-fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('repeatedTopicRule', () => {
  it('fires once a topic is mentioned in >= 3 journals/memories with overlapping tokens', () => {
    const data = makeUserData({
      journals: [
        makeJournal({ id: 'j1', title: 'Reflection', content: 'pottery classes have been wonderful', createdAt: new Date('2026-01-01') }),
        makeJournal({ id: 'j2', title: 'Reflection', content: 'pottery classes have been fun', createdAt: new Date('2026-01-05') }),
        makeJournal({ id: 'j3', title: 'Reflection', content: 'pottery classes have been relaxing', createdAt: new Date('2026-01-10') }),
      ],
    });

    const findings = repeatedTopicRule(data);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('REPEATED_TOPIC');
    expect(findings[0]!.category).toBe('TOPIC');
    expect(findings[0]!.sources).toHaveLength(3);
    expect(findings[0]!.sources.every((s) => s.sourceType === 'JOURNAL')).toBe(true);
  });

  it('does not fire for fewer than 3 matching items', () => {
    const data = makeUserData({
      journals: [
        makeJournal({ id: 'j1', title: 'Reflection', content: 'pottery classes have been wonderful' }),
        makeJournal({ id: 'j2', title: 'Reflection', content: 'pottery classes have been fun' }),
      ],
    });

    expect(repeatedTopicRule(data)).toEqual([]);
  });

  it('never fabricates a source — every finding source id traces to a real input item', () => {
    const journals = [
      makeJournal({ id: 'j1', title: 'Reflection', content: 'pottery classes have been wonderful' }),
      makeJournal({ id: 'j2', title: 'Reflection', content: 'pottery classes have been fun' }),
      makeJournal({ id: 'j3', title: 'Reflection', content: 'pottery classes have been relaxing' }),
    ];
    const findings = repeatedTopicRule(makeUserData({ journals }));
    const realIds = new Set(journals.map((j) => j.id));
    for (const finding of findings) {
      for (const source of finding.sources) {
        expect(realIds.has(source.sourceId)).toBe(true);
      }
    }
  });
});

describe('repeatedGoalRule', () => {
  it('fires when >= 2 goal-related memories are highly similar', () => {
    const goalMemories = [
      makeMemory({ id: 'g1', type: 'GOAL', title: 'Marathon', summary: 'training plan spring race', createdAt: new Date('2026-01-01') }),
      makeMemory({ id: 'g2', type: 'GOAL', title: 'Marathon', summary: 'training plan spring event', createdAt: new Date('2026-01-10') }),
    ];
    const findings = repeatedGoalRule(makeUserData({ goalMemories }));

    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('REPEATED_GOAL');
    expect(findings[0]!.category).toBe('GOAL');
    expect(findings[0]!.sources).toHaveLength(2);
    expect(findings[0]!.scoreHints.isGoalRelevant).toBe(true);
  });

  it('does not fire for dissimilar goal memories', () => {
    const goalMemories = [
      makeMemory({ id: 'g1', type: 'GOAL', title: 'Marathon', summary: 'training plan spring race' }),
      makeMemory({ id: 'g2', type: 'ACHIEVEMENT', title: 'Promotion', summary: 'got promoted at work' }),
    ];
    expect(repeatedGoalRule(makeUserData({ goalMemories }))).toEqual([]);
  });
});

describe('longInactivityRule', () => {
  it('fires when the most recent signal is older than the threshold', () => {
    const latest = new Date(Date.now() - 15 * DAY_MS);
    const data = makeUserData({ activityEvents: [makeActivity({ id: 'a1', createdAt: latest })] });

    const findings = longInactivityRule(data);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('LONG_INACTIVITY');
    expect(findings[0]!.sources).toEqual([{ sourceType: 'ACTIVITY', sourceId: 'a1', sourceTimestamp: latest }]);
  });

  it('does not fire when the most recent signal is within the threshold', () => {
    const latest = new Date(Date.now() - 2 * DAY_MS);
    const data = makeUserData({ activityEvents: [makeActivity({ id: 'a1', createdAt: latest })] });
    expect(longInactivityRule(data)).toEqual([]);
  });

  it('never fabricates a source — with no signals at all, it does not fire', () => {
    expect(longInactivityRule(makeUserData())).toEqual([]);
  });
});

describe('goalRegressionRule', () => {
  it('turns an existing goal-related MemoryConflict into a finding citing both real memories', () => {
    const goalMemories = [
      makeMemory({ id: 'g1', type: 'GOAL', createdAt: new Date('2026-01-01') }),
      makeMemory({ id: 'g2', type: 'GOAL', createdAt: new Date('2026-01-10') }),
    ];
    const goalConflicts = [makeGoalConflict({ id: 'c1', memoryAId: 'g1', memoryBId: 'g2', reason: 'Different target dates.' })];

    const findings = goalRegressionRule(makeUserData({ goalMemories, goalConflicts }));

    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('GOAL_REGRESSION');
    expect(findings[0]!.reason).toContain('Different target dates.');
    expect(findings[0]!.sources.map((s) => s.sourceId).sort()).toEqual(['g1', 'g2']);
  });

  it('skips a conflict referencing a memory no longer in the goal-memory snapshot', () => {
    const goalMemories = [makeMemory({ id: 'g1', type: 'GOAL' })];
    const goalConflicts = [makeGoalConflict({ memoryAId: 'g1', memoryBId: 'missing' })];
    expect(goalRegressionRule(makeUserData({ goalMemories, goalConflicts }))).toEqual([]);
  });
});

describe('positiveStreakRule / negativeStreakRule', () => {
  it('fires for 3 consecutive calendar days of positive mood', () => {
    const journals = [
      makeJournal({ id: 'j1', mood: 'GREAT', createdAt: new Date(2026, 0, 1, 10) }),
      makeJournal({ id: 'j2', mood: 'GOOD', createdAt: new Date(2026, 0, 2, 10) }),
      makeJournal({ id: 'j3', mood: 'GREAT', createdAt: new Date(2026, 0, 3, 10) }),
    ];
    const findings = positiveStreakRule(makeUserData({ journals }));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('POSITIVE_STREAK');
    expect(findings[0]!.sources).toHaveLength(3);
  });

  it('fires for 3 consecutive calendar days of negative mood', () => {
    const journals = [
      makeJournal({ id: 'j1', mood: 'LOW', createdAt: new Date(2026, 0, 1, 10) }),
      makeJournal({ id: 'j2', mood: 'DIFFICULT', createdAt: new Date(2026, 0, 2, 10) }),
      makeJournal({ id: 'j3', mood: 'LOW', createdAt: new Date(2026, 0, 3, 10) }),
    ];
    const findings = negativeStreakRule(makeUserData({ journals }));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('NEGATIVE_STREAK');
    expect(findings[0]!.sources).toHaveLength(3);
  });

  it('does not fire for only 2 consecutive days', () => {
    const journals = [
      makeJournal({ id: 'j1', mood: 'GREAT', createdAt: new Date(2026, 0, 1, 10) }),
      makeJournal({ id: 'j2', mood: 'GOOD', createdAt: new Date(2026, 0, 2, 10) }),
    ];
    expect(positiveStreakRule(makeUserData({ journals }))).toEqual([]);
  });

  it('does not fire across a gap in days', () => {
    const journals = [
      makeJournal({ id: 'j1', mood: 'GREAT', createdAt: new Date(2026, 0, 1, 10) }),
      makeJournal({ id: 'j2', mood: 'GOOD', createdAt: new Date(2026, 0, 5, 10) }),
      makeJournal({ id: 'j3', mood: 'GREAT', createdAt: new Date(2026, 0, 6, 10) }),
    ];
    expect(positiveStreakRule(makeUserData({ journals }))).toEqual([]);
  });
});

describe('repeatedJournalThemeRule', () => {
  it('fires when the same tag appears on >= 3 journal entries', () => {
    const journals = [
      makeJournal({ id: 'j1', tags: ['running'], createdAt: new Date('2026-01-01') }),
      makeJournal({ id: 'j2', tags: ['running'], createdAt: new Date('2026-01-05') }),
      makeJournal({ id: 'j3', tags: ['running', 'health'], createdAt: new Date('2026-01-10') }),
    ];
    const findings = repeatedJournalThemeRule(makeUserData({ journals }));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('REPEATED_JOURNAL_THEME');
    expect(findings[0]!.groupKey).toBe('JOURNAL:tag:running');
    expect(findings[0]!.sources).toHaveLength(3);
  });

  it('does not fire for a tag used only twice', () => {
    const journals = [
      makeJournal({ id: 'j1', tags: ['running'] }),
      makeJournal({ id: 'j2', tags: ['running'] }),
    ];
    expect(repeatedJournalThemeRule(makeUserData({ journals }))).toEqual([]);
  });
});

describe('memoryJournalAlignmentRule', () => {
  it('fires for a memory and journal close in time with overlapping tokens', () => {
    const memories = [
      makeMemory({ id: 'm1', title: 'Career change', summary: 'switching careers to design work', createdAt: new Date('2026-01-01') }),
    ];
    const journals = [
      makeJournal({ id: 'j1', title: 'Reflection', content: 'still thinking about switching careers to design work again', createdAt: new Date('2026-01-03') }),
    ];
    const findings = memoryJournalAlignmentRule(makeUserData({ memories, journals }));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('MEMORY_JOURNAL_ALIGNMENT');
    expect(findings[0]!.sources.map((s) => s.sourceId).sort()).toEqual(['j1', 'm1']);
  });

  it('does not fire when more than the alignment window apart', () => {
    const memories = [
      makeMemory({ id: 'm1', title: 'Career change', summary: 'switching careers to design work', createdAt: new Date('2026-01-01') }),
    ];
    const journals = [
      makeJournal({ id: 'j1', title: 'Reflection', content: 'still thinking about switching careers to design work again', createdAt: new Date('2026-03-01') }),
    ];
    expect(memoryJournalAlignmentRule(makeUserData({ memories, journals }))).toEqual([]);
  });

  it('does not fire for unrelated content', () => {
    const memories = [makeMemory({ id: 'm1', title: 'Pet', summary: 'adopted a cat', createdAt: new Date('2026-01-01') })];
    const journals = [makeJournal({ id: 'j1', title: 'Reflection', content: 'work has been busy lately', createdAt: new Date('2026-01-02') })];
    expect(memoryJournalAlignmentRule(makeUserData({ memories, journals }))).toEqual([]);
  });
});

describe('goalActivityMismatchRule', () => {
  it('fires for an old goal with no recent matching signal', () => {
    const goalMemories = [
      makeMemory({ id: 'g1', type: 'GOAL', title: 'Marathon', summary: 'run a marathon this year', createdAt: new Date(Date.now() - 30 * DAY_MS) }),
    ];
    const findings = goalActivityMismatchRule(makeUserData({ goalMemories }));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.trigger).toBe('GOAL_ACTIVITY_MISMATCH');
    expect(findings[0]!.sources).toEqual([{ sourceType: 'MEMORY', sourceId: 'g1', sourceTimestamp: goalMemories[0]!.createdAt }]);
  });

  it('does not fire when a recent journal entry references the same goal', () => {
    const goalMemories = [
      makeMemory({ id: 'g1', type: 'GOAL', title: 'Marathon', summary: 'run a marathon this year', createdAt: new Date(Date.now() - 30 * DAY_MS) }),
    ];
    const journals = [
      makeJournal({ id: 'j1', title: 'Update', content: 'went for a long run training for the marathon this year', createdAt: new Date(Date.now() - 2 * DAY_MS) }),
    ];
    expect(goalActivityMismatchRule(makeUserData({ goalMemories, journals }))).toEqual([]);
  });

  it('does not fire for a goal that is not old enough yet', () => {
    const goalMemories = [makeMemory({ id: 'g1', type: 'GOAL', title: 'Marathon', summary: 'run a marathon', createdAt: new Date(Date.now() - 3 * DAY_MS) })];
    expect(goalActivityMismatchRule(makeUserData({ goalMemories }))).toEqual([]);
  });
});

describe('companion messages are also a valid source for rules that use them', () => {
  it('longInactivityRule considers the most recent companion message', () => {
    const latest = new Date(Date.now() - 20 * DAY_MS);
    const findings = longInactivityRule(makeUserData({ companionMessages: [makeCompanionMessage({ id: 'msg1', createdAt: latest })] }));
    expect(findings[0]!.sources).toEqual([{ sourceType: 'COMPANION', sourceId: 'msg1', sourceTimestamp: latest }]);
  });
});
