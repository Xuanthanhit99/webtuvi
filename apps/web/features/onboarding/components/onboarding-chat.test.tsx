import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OnboardingChat } from './onboarding-chat';

const mockPush = jest.fn();
const mockMutate = jest.fn().mockResolvedValue(undefined);
let mockNext = '/premium';
let mockStage = 'success';
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), useSearchParams: () => new URLSearchParams({ next: mockNext }) }));
jest.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingState: () => ({ data: { stage: mockStage, messages: [] } }),
  useCompleteOnboarding: () => ({ mutateAsync: mockMutate }),
  useSkipOnboarding: () => ({ mutateAsync: mockMutate }),
  useMemoryConsent: () => ({}),
  useSelectDiscovery: () => ({}),
  useSendOnboardingMessage: () => ({}),
}));

it.each([
  ['success', 'Bắt đầu khám phá', '/premium', '/premium'],
  ['conversation', 'Bỏ qua lúc này', '/discover/tarot?item=123', '/discover/tarot?item=123'],
  ['success', 'Bắt đầu khám phá', '/\\evil.invalid', '/'],
  ['conversation', 'Bỏ qua lúc này', '/%255cevil.invalid', '/'],
])('keeps safe return intent after %s', async (stage, button, next, expected) => {
  mockPush.mockClear();
  mockMutate.mockClear();
  mockStage = stage;
  mockNext = next;
  const original = HTMLElement.prototype.scrollTo;
  HTMLElement.prototype.scrollTo = jest.fn();
  try {
    render(<OnboardingChat />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expected));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  } finally { HTMLElement.prototype.scrollTo = original; }
});
