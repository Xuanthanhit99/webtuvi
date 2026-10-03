import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeIntentRouter } from './home-intent-router';

describe('HomeIntentRouter', () => {
  it('starts from the locked love intent and exposes the real Tarot route', () => {
    render(<HomeIntentRouter />);

    expect(screen.getByRole('heading', { name: 'Điều gì đang khiến bạn bận lòng?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tình yêu/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /Rút bài Tarot/i })).toHaveAttribute('href', '/discover/tarot');
  });

  it('changes recommendation and route when an intent is selected', async () => {
    const user = userEvent.setup();
    render(<HomeIntentRouter />);

    await user.click(screen.getByRole('button', { name: /Công việc/i }));

    expect(screen.getByRole('button', { name: /Công việc/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Tình yêu/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: 'Bắt đầu với Tử Vi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem Tử Vi/i })).toHaveAttribute('href', '/discover/tu-vi');
  });

  it('keeps self-understanding routed to the natal chart surface', async () => {
    const user = userEvent.setup();
    render(<HomeIntentRouter />);

    await user.click(screen.getByRole('button', { name: /Hiểu bản thân/i }));

    expect(screen.getByRole('heading', { name: 'Bắt đầu với Bản đồ sao' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dựng Bản đồ sao/i })).toHaveAttribute('href', '/discover/natal-chart');
  });

  it('renders all six intent controls as accessible buttons', () => {
    render(<HomeIntentRouter />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });
});
