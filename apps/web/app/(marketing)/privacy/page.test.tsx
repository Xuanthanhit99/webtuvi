import { render, screen } from '@testing-library/react';
import PrivacyPage, { metadata } from './page';

// Legal Content Completion — proves the Sprint 1 placeholder is gone and the real notice covers
// the required topics, without asserting exact prose (which will keep evolving with founder/legal
// input) so this test doesn't become brittle against wording tweaks.
describe('PrivacyPage', () => {
  it('no longer contains the Sprint 1 placeholder disclaimer', () => {
    render(<PrivacyPage />);
    expect(screen.queryByText(/plain-language summary for Sprint 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/placeholder summary for Sprint 1/i)).not.toBeInTheDocument();
  });

  it('never shows stale brand names', () => {
    render(<PrivacyPage />);
    expect(screen.queryByText(/BeaconVie/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mệnh Vi/)).not.toBeInTheDocument();
  });

  it('covers deletion, export, AI processing, and third-party processors', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: /deleting your account/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /exporting your data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ai processing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /third-party processors/i })).toBeInTheDocument();
  });

  it('accurately states AI narrates already-computed facts, never calculates them', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/AI never determines, chooses, or alters any of these facts/i)).toBeInTheDocument();
  });

  it('marks facts only the founder/legal reviewer can supply, rather than inventing them', () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/Owner\/Legal to confirm/i).length).toBeGreaterThan(0);
  });

  it('has real, production-oriented metadata (not indexable-blocking, real description)', () => {
    expect(metadata.title).toBe('Privacy Notice');
    expect(typeof metadata.description).toBe('string');
    expect(metadata.description).not.toMatch(/placeholder/i);
  });
});
