import { render, screen } from '@testing-library/react';
import type { TuViChartDto } from '@beaconvie/types';
import { TuViTieuHanYearNav } from './tu-vi-tieu-han-year-nav';

function baseChart(overrides: Partial<TuViChartDto> = {}): TuViChartDto {
  return {
    id: 'c1',
    status: 'ACTIVE',
    birthDate: '1984-02-02',
    birthTime: '00:30',
    sex: 'Nam',
    versions: {
      engineVersion: 'v1', calendarVersion: 'v1', rulesetVersion: 'v1', mainStarVersion: 'v1',
      auxiliaryVersion: 'v1', tuanTrietVersion: 'v1', tuHoaVersion: 'v1', dignityVersion: 'v1', cycleVersion: 'v1',
    },
    lunarDate: { lunarYear: 1984, lunarMonth: 1, lunarDay: 1, isLeapMonth: false },
    hourBranch: 'Tý',
    canChi: { year: { stem: 'Giáp', branch: 'Tý' } },
    palaces: { menh: 'Dần', than: 'Dần', layout: {} as TuViChartDto['palaces']['layout'] },
    cuc: 'Hỏa Lục Cục',
    mainStars: [],
    auxiliaryStars: [],
    tuan: { first: 'Tuất', second: 'Hợi' },
    triet: { first: 'Thân', second: 'Dậu' },
    transformations: [],
    daiVan: [],
    tieuHanStart: null,
    currentDaiVan: null,
    currentTieuHan: null,
    nearbyTieuHan: [],
    interpretation: null,
    interpretedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archivedAt: null,
    ...overrides,
  };
}

describe('TuViTieuHanYearNav', () => {
  it('renders nothing for a pre-feature chart (tieuHanStart null)', () => {
    const { container } = render(<TuViTieuHanYearNav chart={baseChart()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an honest unavailable state when tieuHanStart exists but the person is under 13 (empty nearbyTieuHan)', () => {
    render(<TuViTieuHanYearNav chart={baseChart({ tieuHanStart: { startPalace: 'Tuất', thuan: true }, nearbyTieuHan: [] })} />);
    expect(screen.getByText(/13 tuổi trở lên/)).toBeInTheDocument();
    // Never fabricates a year list when unsupported.
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders the real year window with real lunar years, ages, and palaces', () => {
    const nearbyTieuHan: TuViChartDto['nearbyTieuHan'] = [
      { tuoi: 41, lunarYear: 2024, palace: 'Dần' },
      { tuoi: 42, lunarYear: 2025, palace: 'Mão' },
      { tuoi: 43, lunarYear: 2026, palace: 'Thìn' },
      { tuoi: 44, lunarYear: 2027, palace: 'Tỵ' },
      { tuoi: 45, lunarYear: 2028, palace: 'Ngọ' },
    ];
    render(
      <TuViTieuHanYearNav
        chart={baseChart({ tieuHanStart: { startPalace: 'Tuất', thuan: true }, nearbyTieuHan, currentTieuHan: nearbyTieuHan[2] })}
      />,
    );
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2028')).toBeInTheDocument();
    expect(screen.getByText(/43 tuổi · hiện tại/)).toBeInTheDocument();
  });

  it('marks exactly the current year with aria-current, not any other year in the window', () => {
    const nearbyTieuHan: TuViChartDto['nearbyTieuHan'] = [
      { tuoi: 41, lunarYear: 2024, palace: 'Dần' },
      { tuoi: 42, lunarYear: 2025, palace: 'Mão' },
      { tuoi: 43, lunarYear: 2026, palace: 'Thìn' },
    ];
    render(
      <TuViTieuHanYearNav
        chart={baseChart({ tieuHanStart: { startPalace: 'Tuất', thuan: true }, nearbyTieuHan, currentTieuHan: nearbyTieuHan[1] })}
      />,
    );
    const list = screen.getByRole('list');
    const current = list.querySelector('[aria-current="true"]');
    expect(current).toHaveTextContent('2025');
  });
});
