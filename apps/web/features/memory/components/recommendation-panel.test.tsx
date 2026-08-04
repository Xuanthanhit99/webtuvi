import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { RecommendationPanel } from './recommendation-panel';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    intelligence: {
      recommendations: jest.fn(),
    },
  },
}));

describe('RecommendationPanel', () => {
  it('shows an empty state when there is nothing to recommend', async () => {
    (memoryApi.intelligence.recommendations as jest.Mock).mockResolvedValue({
      items: [],
      candidateCount: 0,
      budget: { totalWindowTokens: 8000, reservedOutputTokens: 1024, systemPromptTokens: 0, conversationTokens: 0, userInputTokens: 0, memoryTokens: 1500 },
      tokenUsed: 0,
    });

    renderWithQuery(<RecommendationPanel />);

    expect(await screen.findByText('Nothing to recommend yet.')).toBeInTheDocument();
  });

  it('shows recommended memories with their type and why-recommended explanation', async () => {
    (memoryApi.intelligence.recommendations as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'mem-1',
          type: 'GOAL',
          title: 'Learn Japanese',
          summary: 'Working toward JLPT N3',
          pinned: false,
          importanceScore: 62,
          importanceExplanations: ['This relates to a goal or a decision you made.'],
          whyRecommended: 'Surfaced because this relates to a goal or a decision you made.',
        },
      ],
      candidateCount: 3,
      budget: { totalWindowTokens: 8000, reservedOutputTokens: 1024, systemPromptTokens: 0, conversationTokens: 0, userInputTokens: 0, memoryTokens: 1500 },
      tokenUsed: 20,
    });

    renderWithQuery(<RecommendationPanel />);

    expect(await screen.findByText('Learn Japanese')).toBeInTheDocument();
    expect(screen.getByText(/surfaced because/i)).toBeInTheDocument();
  });

  it('never shows a raw importance score without the "Why?" explanation control alongside it', async () => {
    (memoryApi.intelligence.recommendations as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'mem-1',
          type: 'GOAL',
          title: 'Learn Japanese',
          summary: 'Working toward JLPT N3',
          pinned: false,
          importanceScore: 62,
          importanceExplanations: ['This relates to a goal or a decision you made.'],
          whyRecommended: 'Surfaced because this relates to a goal or a decision you made.',
        },
      ],
      candidateCount: 1,
      budget: { totalWindowTokens: 8000, reservedOutputTokens: 1024, systemPromptTokens: 0, conversationTokens: 0, userInputTokens: 0, memoryTokens: 1500 },
      tokenUsed: 20,
    });

    renderWithQuery(<RecommendationPanel />);
    await screen.findByText('Learn Japanese');

    // The raw "62" is not shown anywhere until "Why?" is expanded.
    expect(screen.queryByText(/62/)).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /why\?/i }));
    expect(await screen.findByText(/62\/100/)).toBeInTheDocument();
  });
});
