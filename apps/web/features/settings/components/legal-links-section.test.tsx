import { render, screen } from '@testing-library/react';
import { LegalLinksSection } from './legal-links-section';

// Pre-Live Product Experience Completion Audit finding #8: legal pages had no in-app path for
// authenticated users. This proves the Settings page now offers one, with normal link semantics
// (real <a> hrefs, keyboard-reachable, no custom navigation behavior).
describe('LegalLinksSection', () => {
  it('links to Privacy, Terms, and Contact with real, correct hrefs', () => {
    render(<LegalLinksSection />);
    expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });
});
