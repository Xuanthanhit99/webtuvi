import { DashboardService } from './dashboard.service';

const USER_ID = 'user-1';

function makePrismaMock() {
  return {
    user: {
      findUnique: jest.fn(async () => ({
        id: USER_ID,
        displayName: 'Alex',
        onboardingCompletedAt: null,
      })),
    },
    conversation: { findFirst: jest.fn(async () => null) },
    tarotReading: { findFirst: jest.fn(async () => null) },
    numerologyReading: { findFirst: jest.fn(async () => null) },
  };
}

function makeService() {
  const prisma = makePrismaMock();
  const memoryRecordService = { mostRecentAccepted: jest.fn(async () => null) };
  const memoryService = { mostRecent: jest.fn(async () => null) };
  const activitiesService = { recent: jest.fn(async () => []) };

  const service = new DashboardService(
    prisma as never,
    memoryService as never,
    memoryRecordService as never,
    activitiesService as never,
  );
  return { service };
}

// Pre-Live Product Experience Completion Audit remediation (dead-copy search, item 17): the
// discoverySuggestion card's description was hardcoded and never revisited as Natal Chart (Sprint
// 9) and Eastern Horoscope (Sprint 17) shipped — it kept telling users "your chart is on its way"
// long after the chart was live. This regression-proofs the fix.
describe('DashboardService — discoverySuggestion honesty', () => {
  it('never claims the chart is still pending, since Natal Chart has shipped', async () => {
    const { service } = makeService();
    const viewModel = await service.getViewModel(USER_ID);

    // discoverySuggestion is typed nullable on DashboardViewModelDto (packages/types), even though
    // this code path always constructs a concrete object — narrow explicitly rather than asserting.
    expect(viewModel.discoverySuggestion).not.toBeNull();
    const suggestion = viewModel.discoverySuggestion!;

    expect(suggestion.description).not.toMatch(/on its way/i);
    expect(suggestion.description).not.toMatch(/coming soon/i);
    expect(suggestion.comingSoon).toBe(false);
  });

  it('describes the discoverySuggestion card as live, present-tense', async () => {
    const { service } = makeService();
    const viewModel = await service.getViewModel(USER_ID);

    expect(viewModel.discoverySuggestion).not.toBeNull();
    expect(viewModel.discoverySuggestion!.description).toMatch(/live now/i);
  });
});
