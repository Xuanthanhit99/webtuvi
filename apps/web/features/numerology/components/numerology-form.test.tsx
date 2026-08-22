import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NumerologyReadingDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ApiError } from '@/lib/api-error';
import { NumerologyForm } from './numerology-form';
import { numerologyApi } from '../api/numerology-api';

jest.mock('../api/numerology-api', () => ({
  numerologyApi: { calculate: jest.fn(), listMeanings: jest.fn(), getReading: jest.fn() },
}));

const calculatedReading: NumerologyReadingDto = {
  id: 'r1',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  birthNameInput: 'Nguyen Van A',
  normalizedBirthName: 'NGUYEN VAN A',
  birthDate: '1995-08-17',
  calculationVersion: 'numerology-pythagorean-v1',
  normalizationVersion: 'numerology-name-normalization-v1',
  interpretation: 'A grounded reflection on your numbers.',
  values: [
    {
      type: 'LIFE_PATH',
      value: 22,
      isMasterNumber: true,
      appliesToYear: null,
      order: 0,
      breakdown: {
        normalizedDate: '1995-08-17',
        components: [
          { component: 'MONTH', input: 8, reduction: { value: 8, isMasterNumber: false, steps: [] } },
          { component: 'DAY', input: 17, reduction: { value: 8, isMasterNumber: false, steps: [{ from: 17, digits: [1, 7], to: 8 }] } },
          { component: 'YEAR', input: 1995, reduction: { value: 6, isMasterNumber: false, steps: [{ from: 1995, digits: [1, 9, 9, 5], to: 24 }, { from: 24, digits: [2, 4], to: 6 }] } },
        ],
        total: 22,
        finalReduction: { value: 22, isMasterNumber: true, steps: [] },
      },
    },
  ],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

describe('NumerologyForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    (numerologyApi.listMeanings as jest.Mock).mockResolvedValue([]);
  });

  it('requires a full birth name before submitting', async () => {
    const user = userEvent.setup();
    renderWithQuery(<NumerologyForm />);
    await user.click(screen.getByRole('button', { name: /calculate my numbers/i }));
    expect(await screen.findByText(/full birth name is required/i)).toBeInTheDocument();
    expect(numerologyApi.calculate).not.toHaveBeenCalled();
  });

  it('prefills a short-lived guest Numerology DOB draft from sessionStorage without using the URL', () => {
    window.sessionStorage.setItem(
      'mv_guest_numerology_preview',
      JSON.stringify({
        type: 'numerology',
        birthDate: '1995-08-17',
        lifePath: 22,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      }),
    );

    renderWithQuery(<NumerologyForm />);

    expect(screen.getByLabelText(/date of birth/i)).toHaveValue('1995-08-17');
  });

  it('requires a birth date before submitting', async () => {
    const user = userEvent.setup();
    renderWithQuery(<NumerologyForm />);
    await user.type(screen.getByLabelText(/full birth name/i), 'Jane Doe');
    await user.click(screen.getByRole('button', { name: /calculate my numbers/i }));
    expect(await screen.findByText(/birth date is required/i)).toBeInTheDocument();
    expect(numerologyApi.calculate).not.toHaveBeenCalled();
  });

  it('calculating reveals the real, already-computed result — including a preserved Master Number', async () => {
    (numerologyApi.calculate as jest.Mock).mockResolvedValue(calculatedReading);
    const onCalculated = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<NumerologyForm onCalculated={onCalculated} />);

    await user.type(screen.getByLabelText(/full birth name/i), 'Nguyen Van A');
    await user.type(screen.getByLabelText(/date of birth/i), '1995-08-17');
    await user.click(screen.getByRole('button', { name: /calculate my numbers/i }));

    await waitFor(() => expect(screen.getByText('22')).toBeInTheDocument());
    expect(screen.getByText('Master Number')).toBeInTheDocument();
    expect(numerologyApi.calculate).toHaveBeenCalledWith('Nguyen Van A', '1995-08-17');
    expect(onCalculated).toHaveBeenCalledWith(calculatedReading);
    // Sprint 8.5 remediation: the interpretation is labeled as AI, distinct from the deterministic
    // Life Path number above it.
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
  });

  it('a PREMIUM_REQUIRED calculate error shows an upgrade banner with a link to /premium', async () => {
    (numerologyApi.calculate as jest.Mock).mockRejectedValue(
      new ApiError("You've reached today's free calculation limit (5). Upgrade to Premium for a higher daily allowance.", 'PREMIUM_REQUIRED', 403),
    );
    const user = userEvent.setup();
    renderWithQuery(<NumerologyForm />);
    await user.type(screen.getByLabelText(/full birth name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
    await user.click(screen.getByRole('button', { name: /calculate my numbers/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/free calculation limit/i);
    const upgradeLink = screen.getByRole('link', { name: 'Upgrade to Premium' });
    expect(upgradeLink).toHaveAttribute('href', '/premium?reason=required');
  });

  it('a real backend validation error (bad date) surfaces as a field-level error, not a generic banner', async () => {
    (numerologyApi.calculate as jest.Mock).mockRejectedValue(
      new ApiError('That is not a real calendar date.', 'NUMEROLOGY_INVALID_CALENDAR_DATE', 400),
    );
    const user = userEvent.setup();
    renderWithQuery(<NumerologyForm />);
    await user.type(screen.getByLabelText(/full birth name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
    await user.click(screen.getByRole('button', { name: /calculate my numbers/i }));

    expect(await screen.findByText('That is not a real calendar date.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Upgrade to Premium' })).not.toBeInTheDocument();
  });

  it('"Calculate another reading" resets back to the form', async () => {
    (numerologyApi.calculate as jest.Mock).mockResolvedValue(calculatedReading);
    const user = userEvent.setup();
    renderWithQuery(<NumerologyForm />);
    await user.type(screen.getByLabelText(/full birth name/i), 'Nguyen Van A');
    await user.type(screen.getByLabelText(/date of birth/i), '1995-08-17');
    await user.click(screen.getByRole('button', { name: /calculate my numbers/i }));

    await screen.findByText('22');
    await user.click(screen.getByRole('button', { name: /calculate another reading/i }));
    expect(screen.getByRole('button', { name: /calculate my numbers/i })).toBeInTheDocument();
    expect(screen.queryByText('22')).not.toBeInTheDocument();
  });
});
