import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ListNumerologyReadingsResultDto, NumerologyReadingDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { NumerologyDashboard } from './numerology-dashboard';
import { numerologyApi } from '../api/numerology-api';

const mockReplace = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/numerology-api', () => ({
  numerologyApi: {
    listReadings: jest.fn(),
    getReading: jest.fn(),
    calculate: jest.fn(),
    listMeanings: jest.fn(),
  },
}));

jest.mock('@/features/premium/hooks/use-premium-status', () => ({
  usePremiumStatus: () => ({ data: { isPremium: false } }),
}));

const reading: NumerologyReadingDto = {
  id: 'r1',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  birthNameInput: 'Jane Doe',
  normalizedBirthName: 'JANE DOE',
  birthDate: '1990-01-01',
  calculationVersion: 'numerology-pythagorean-v1',
  normalizationVersion: 'numerology-name-normalization-v1',
  interpretation: 'A grounded reflection.',
  values: [
    {
      type: 'LIFE_PATH',
      value: 3,
      isMasterNumber: false,
      appliesToYear: null,
      order: 0,
      breakdown: {
        normalizedDate: '1990-01-01',
        components: [
          { component: 'MONTH', input: 1, reduction: { value: 1, isMasterNumber: false, steps: [] } },
          { component: 'DAY', input: 1, reduction: { value: 1, isMasterNumber: false, steps: [] } },
          { component: 'YEAR', input: 1990, reduction: { value: 1, isMasterNumber: false, steps: [{ from: 1990, digits: [1, 9, 9, 0], to: 19 }, { from: 19, digits: [1, 9], to: 10 }, { from: 10, digits: [1, 0], to: 1 }] } },
        ],
        total: 3,
        finalReduction: { value: 3, isMasterNumber: false, steps: [] },
      },
    },
  ],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

const listResult: ListNumerologyReadingsResultDto = { items: [reading], total: 1, page: 1, pageSize: 20 };

describe('NumerologyDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
    (numerologyApi.listMeanings as jest.Mock).mockResolvedValue([]);
  });

  it('renders the calculation form and real reading history by default', async () => {
    (numerologyApi.listReadings as jest.Mock).mockResolvedValue(listResult);
    renderWithQuery(<NumerologyDashboard />);
    expect(screen.getByRole('heading', { name: 'Numerology' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate my numbers/i })).toBeInTheDocument();
    expect(await screen.findByText('JANE DOE')).toBeInTheDocument();
  });

  it('shows an empty state when there is no history yet', async () => {
    (numerologyApi.listReadings as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithQuery(<NumerologyDashboard />);
    expect(await screen.findByText('No readings yet')).toBeInTheDocument();
  });

  it('opening ?item=<id> renders the real reading detail instead of the form/history view', async () => {
    mockSearchParamsValue = 'item=r1';
    (numerologyApi.getReading as jest.Mock).mockResolvedValue(reading);
    renderWithQuery(<NumerologyDashboard />);

    expect(await screen.findByText('A grounded reflection.')).toBeInTheDocument();
    expect(numerologyApi.getReading).toHaveBeenCalledWith('r1');
    expect(screen.queryByRole('button', { name: /calculate my numbers/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Back to Numerology' })).toBeInTheDocument();
  });

  it('closing the detail view navigates back to the plain /discover/numerology route', async () => {
    mockSearchParamsValue = 'item=r1';
    (numerologyApi.getReading as jest.Mock).mockResolvedValue(reading);
    const user = userEvent.setup();
    renderWithQuery(<NumerologyDashboard />);

    await screen.findByText('A grounded reflection.');
    await user.click(screen.getByRole('button', { name: '← Back to Numerology' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/discover/numerology', { scroll: false }));
  });
});
