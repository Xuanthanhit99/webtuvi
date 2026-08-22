import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { TuViTrustSection } from './tu-vi-trust-section';

describe('TuViTrustSection', () => {
  it('is collapsed by default and expands on click, never exposing raw engine/ruleset version strings', async () => {
    const user = userEvent.setup();
    render(<TuViTrustSection />);

    const toggle = screen.getByRole('button', { name: /AI không an sao cho bạn/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Vân Đằng Thái Thứ Lang/)).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Vân Đằng Thái Thứ Lang/)).toBeInTheDocument();
    expect(screen.getByText('12 Cung')).toBeInTheDocument();
    expect(screen.getByText('14 Chính Tinh')).toBeInTheDocument();
    expect(screen.getByText('Tứ Hóa')).toBeInTheDocument();

    const body = screen.getByText(/Vân Đằng Thái Thứ Lang/).closest('section');
    expect(body?.textContent).not.toMatch(/vdttl-1956-v1|tuvi-engine-v1|core-13-v1|RULE_ID/i);
  });

  it('renders expanded by default when defaultOpen is set (e.g. right after a real result)', () => {
    render(<TuViTrustSection defaultOpen />);
    expect(screen.getByRole('button', { name: /AI không an sao cho bạn/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Vân Đằng Thái Thứ Lang/)).toBeInTheDocument();
  });
});
