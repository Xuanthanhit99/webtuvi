import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GeocodingSearchResultDto, NatalChartDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ApiError } from '@/lib/api-error';
import { BirthInputForm } from './birth-input-form';
import { geocodingApi, natalChartApi } from '../api/natal-chart-api';

jest.mock('../api/natal-chart-api', () => ({
  natalChartApi: { create: jest.fn(), getChart: jest.fn() },
  geocodingApi: { search: jest.fn() },
}));

const candidates: GeocodingSearchResultDto[] = [
  { token: 'token-hanoi', label: 'Hà Nội, Vietnam' },
  { token: 'token-hanoi-ny', label: 'Hanoi, New York, USA' },
];

const calculatedChart: NatalChartDto = {
  id: 'c1',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  birthDate: '2000-06-15',
  birthTime: '14:30',
  birthTimeKnown: true,
  birthPlaceLabel: 'Hà Nội, Vietnam',
  timezone: 'Asia/Ho_Chi_Minh',
  zodiacMode: 'tropical',
  houseSystem: 'placidus',
  housesAvailable: true,
  calculationVersion: 'natal-chart-circular-horoscope-v1',
  engineVersion: '1.1.0',
  ascendant: { longitude: 209.87, sign: 'libra', degreeInSign: 29.87, meaning: 'Ascendant in Libra' },
  midheaven: null,
  placements: [
    { body: 'sun', longitude: 84.5, sign: 'gemini', degreeInSign: 24.5, house: 8, retrograde: false, meaning: 'Sun in Gemini' },
    { body: 'moon', longitude: 246.6, sign: 'sagittarius', degreeInSign: 6.6, house: 2, retrograde: false, meaning: 'Moon in Sagittarius' },
    { body: 'mercury', longitude: 90, sign: 'cancer', degreeInSign: 0, house: 9, retrograde: false, meaning: 'Mercury' },
    { body: 'venus', longitude: 100, sign: 'cancer', degreeInSign: 10, house: 9, retrograde: false, meaning: 'Venus' },
    { body: 'mars', longitude: 120, sign: 'leo', degreeInSign: 0, house: 10, retrograde: false, meaning: 'Mars' },
    { body: 'jupiter', longitude: 150, sign: 'virgo', degreeInSign: 0, house: 11, retrograde: false, meaning: 'Jupiter' },
    { body: 'saturn', longitude: 180, sign: 'libra', degreeInSign: 0, house: 12, retrograde: false, meaning: 'Saturn' },
    { body: 'uranus', longitude: 210, sign: 'scorpio', degreeInSign: 0, house: 1, retrograde: false, meaning: 'Uranus' },
    { body: 'neptune', longitude: 240, sign: 'sagittarius', degreeInSign: 0, house: 2, retrograde: false, meaning: 'Neptune' },
    { body: 'pluto', longitude: 270, sign: 'capricorn', degreeInSign: 0, house: 3, retrograde: false, meaning: 'Pluto' },
  ],
  houses: Array.from({ length: 12 }, (_, i) => ({ number: i + 1, cuspLongitude: i * 30, sign: 'aries' as const })),
  aspects: [],
  interpretation: null,
  interpretedAt: null,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

describe('BirthInputForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a birth date before submitting', async () => {
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));
    expect(await screen.findByText(/birth date is required/i)).toBeInTheDocument();
    expect(natalChartApi.create).not.toHaveBeenCalled();
  });

  it('requires searching and selecting a place before submitting', async () => {
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);
    await user.type(screen.getByLabelText(/date of birth/i), '2000-06-15');
    await user.type(screen.getByLabelText(/time of birth/i), '14:30');
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));
    expect(await screen.findByText(/search for your birth place/i)).toBeInTheDocument();
    expect(natalChartApi.create).not.toHaveBeenCalled();
  });

  it('never calls geocoding search until the Search button is explicitly clicked — no per-keystroke autocomplete', async () => {
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);
    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    expect(geocodingApi.search).not.toHaveBeenCalled();
  });

  it('searching shows candidates; selecting one shows a confirmed selection, never raw coordinates', async () => {
    (geocodingApi.search as jest.Mock).mockResolvedValue(candidates);
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);

    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    expect(await screen.findByText('Hà Nội, Vietnam')).toBeInTheDocument();
    expect(screen.getByText('Hanoi, New York, USA')).toBeInTheDocument();

    await user.click(screen.getByText('Hà Nội, Vietnam'));
    expect(screen.queryByText('Hanoi, New York, USA')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('calculating sends only the birth date/time and the opaque location token — never raw coordinates', async () => {
    (geocodingApi.search as jest.Mock).mockResolvedValue(candidates);
    (natalChartApi.create as jest.Mock).mockResolvedValue(calculatedChart);
    const onCalculated = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm onCalculated={onCalculated} />);

    await user.type(screen.getByLabelText(/date of birth/i), '2000-06-15');
    await user.type(screen.getByLabelText(/time of birth/i), '14:30');
    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    await user.click(await screen.findByText('Hà Nội, Vietnam'));
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));

    await waitFor(() => expect(natalChartApi.create).toHaveBeenCalledWith({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: 'token-hanoi' }));
    await waitFor(() => expect(onCalculated).toHaveBeenCalledWith(calculatedChart));
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
  });

  it('checking "I don’t know my birth time" disables the time field and omits it from the request', async () => {
    (geocodingApi.search as jest.Mock).mockResolvedValue(candidates);
    (natalChartApi.create as jest.Mock).mockResolvedValue({ ...calculatedChart, birthTime: null, birthTimeKnown: false, housesAvailable: false, ascendant: null });
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);

    await user.type(screen.getByLabelText(/date of birth/i), '2000-06-15');
    await user.click(screen.getByLabelText(/i don’t know my birth time/i));
    expect(screen.getByLabelText(/time of birth/i)).toBeDisabled();

    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    await user.click(await screen.findByText('Hà Nội, Vietnam'));
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));

    await waitFor(() => expect(natalChartApi.create).toHaveBeenCalledWith({ birthDate: '2000-06-15', birthTime: undefined, locationToken: 'token-hanoi' }));
  });

  it('a geocoding failure shows a truthful "unavailable" message, never an empty silent result', async () => {
    (geocodingApi.search as jest.Mock).mockRejectedValue(new ApiError('down', 'GEOCODING_UNAVAILABLE', 503));
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);

    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it('a PREMIUM_REQUIRED create error shows an upgrade banner with a link to /premium', async () => {
    (geocodingApi.search as jest.Mock).mockResolvedValue(candidates);
    (natalChartApi.create as jest.Mock).mockRejectedValue(
      new ApiError("You've reached today's free chart creation limit (5). Upgrade to Premium.", 'PREMIUM_REQUIRED', 403),
    );
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);

    await user.type(screen.getByLabelText(/date of birth/i), '2000-06-15');
    await user.type(screen.getByLabelText(/time of birth/i), '14:30');
    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    await user.click(await screen.findByText('Hà Nội, Vietnam'));
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/free chart creation limit/i);
    expect(screen.getByRole('link', { name: 'Upgrade to Premium' })).toHaveAttribute('href', '/premium?reason=required');
  });

  it('an expired location token surfaces as a place-field error prompting the user to search again', async () => {
    (geocodingApi.search as jest.Mock).mockResolvedValue(candidates);
    (natalChartApi.create as jest.Mock).mockRejectedValue(
      new ApiError('That location search result has expired — please search again.', 'NATAL_CHART_LOCATION_NOT_RESOLVED', 400),
    );
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);

    await user.type(screen.getByLabelText(/date of birth/i), '2000-06-15');
    await user.type(screen.getByLabelText(/time of birth/i), '14:30');
    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    await user.click(await screen.findByText('Hà Nội, Vietnam'));
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));

    expect(await screen.findByText(/expired/i)).toBeInTheDocument();
  });

  it('"Calculate another chart" resets back to the form', async () => {
    (geocodingApi.search as jest.Mock).mockResolvedValue(candidates);
    (natalChartApi.create as jest.Mock).mockResolvedValue(calculatedChart);
    const user = userEvent.setup();
    renderWithQuery(<BirthInputForm />);

    await user.type(screen.getByLabelText(/date of birth/i), '2000-06-15');
    await user.type(screen.getByLabelText(/time of birth/i), '14:30');
    await user.type(screen.getByLabelText(/place of birth/i), 'Ha Noi');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    await user.click(await screen.findByText('Hà Nội, Vietnam'));
    await user.click(screen.getByRole('button', { name: /calculate my chart/i }));

    await screen.findByText('AI Interpretation');
    await user.click(screen.getByRole('button', { name: /calculate another chart/i }));
    expect(screen.getByRole('button', { name: /calculate my chart/i })).toBeInTheDocument();
  });
});
