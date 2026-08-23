import { render, screen } from '@testing-library/react';
import TermsPage, { metadata } from './page';

// Legal Content Completion — proves the Sprint 1 placeholder is gone and the real terms cover the
// required topics, without asserting exact prose (which will keep evolving with founder/legal
// input) so this test doesn't become brittle against wording tweaks.
describe('TermsPage', () => {
  it('no longer contains the Sprint 1 placeholder disclaimer', () => {
    render(<TermsPage />);
    expect(screen.queryByText(/placeholder summary for Sprint 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/plain-language summary for Sprint 1/i)).not.toBeInTheDocument();
  });

  it('never shows stale brand names', () => {
    render(<TermsPage />);
    expect(screen.queryByText(/BeaconVie/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mệnh Vi/)).not.toBeInTheDocument();
  });

  it('keeps the not-medical/psychological/financial-advice and crisis-line disclaimer', () => {
    render(<TermsPage />);
    expect(screen.getByText(/not a medical, psychological, financial, or legal advice service/i)).toBeInTheDocument();
    expect(screen.getByText(/crisis line in your region/i)).toBeInTheDocument();
  });

  it('never promises a guaranteed prediction, and discloses AI-generated content limitations', () => {
    render(<TermsPage />);
    expect(screen.getByText(/guaranteed prediction of future events/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ai-generated content/i })).toBeInTheDocument();
  });

  it('describes Premium as a one-time, non-recurring purchase, not a subscription', () => {
    render(<TermsPage />);
    expect(screen.getByText(/not a recurring subscription/i)).toBeInTheDocument();
  });

  it('does not invent a refund policy or governing law — flags them for founder/legal instead', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/Owner\/Legal to confirm/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /governing law and disputes/i })).toBeInTheDocument();
  });

  it('has real, production-oriented metadata', () => {
    expect(metadata.title).toBe('Terms of Service');
    expect(metadata.description).not.toMatch(/placeholder/i);
  });
});
