import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TuViChartDto } from '@beaconvie/types';
import { TuViDaiVanTimeline } from './tu-vi-dai-van-timeline';

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

const cycles: TuViChartDto['daiVan'] = [
  { index: 0, ageStart: 6, ageEnd: 15, role: 'Mệnh', position: 'Dần' },
  { index: 1, ageStart: 16, ageEnd: 25, role: 'Phụ Mẫu', position: 'Mão' },
  { index: 2, ageStart: 26, ageEnd: 35, role: 'Phúc Đức', position: 'Thìn' },
  { index: 3, ageStart: 36, ageEnd: 45, role: 'Điền Trạch', position: 'Tỵ' },
];

describe('TuViDaiVanTimeline', () => {
  it('renders nothing for a pre-feature chart (empty daiVan)', () => {
    const { container } = render(<TuViDaiVanTimeline chart={baseChart()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders every cycle as a selectable period and marks the current one', () => {
    render(<TuViDaiVanTimeline chart={baseChart({ daiVan: cycles, currentDaiVan: cycles[2] })} />);
    expect(screen.getByRole('tab', { name: /6–15/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /26–35/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText(/Hiện tại: 26–35 tuổi/)).toBeInTheDocument();
  });

  it('defaults the detail panel to the current period, not necessarily the first', () => {
    render(<TuViDaiVanTimeline chart={baseChart({ daiVan: cycles, currentDaiVan: cycles[2] })} />);
    expect(screen.getByText(/Phúc Đức/, { selector: 'dd' })).toBeInTheDocument();
  });

  it('selecting a different period updates the detail panel, never recalculating a new fact client-side', async () => {
    const user = userEvent.setup();
    render(<TuViDaiVanTimeline chart={baseChart({ daiVan: cycles, currentDaiVan: cycles[0] })} />);

    await user.click(screen.getByRole('tab', { name: /36–45/ }));
    expect(screen.getByText(/Điền Trạch/, { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /36–45/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('with no currentDaiVan (tuổi before the first cycle), still renders and defaults to the first period', () => {
    render(<TuViDaiVanTimeline chart={baseChart({ daiVan: cycles, currentDaiVan: null })} />);
    expect(screen.queryByText(/Hiện tại:/)).not.toBeInTheDocument();
    expect(screen.getByText(/Mệnh/, { selector: 'dd' })).toBeInTheDocument();
  });
});
