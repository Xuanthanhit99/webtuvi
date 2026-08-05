import { screen, waitFor } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { ReflectionHintBanner } from './reflection-hint-banner';
import { companionReflectionApi } from '../api/companion-reflection-api';

jest.mock('../api/companion-reflection-api', () => ({
  companionReflectionApi: { hint: jest.fn() },
}));

describe('ReflectionHintBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when no reflection candidate exists — never a fabricated nudge', async () => {
    (companionReflectionApi.hint as jest.Mock).mockResolvedValue({ available: false, reflectionId: null, category: null });
    const { container } = renderWithQuery(<ReflectionHintBanner />);
    await waitFor(() => expect(companionReflectionApi.hint).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the fixed nudge sentence and links to the real candidate when one exists', async () => {
    (companionReflectionApi.hint as jest.Mock).mockResolvedValue({ available: true, reflectionId: 'r1', category: 'GOAL' });
    renderWithQuery(<ReflectionHintBanner />);
    const link = await screen.findByRole('link', { name: /you may want to reflect on this/i });
    expect(link).toHaveAttribute('href', '/reflections?item=r1');
  });

  it('renders nothing while loading — no placeholder claiming a reflection exists before it does', () => {
    (companionReflectionApi.hint as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithQuery(<ReflectionHintBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
