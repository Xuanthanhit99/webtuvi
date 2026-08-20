import { render, screen } from '@testing-library/react';
import LandingPage from './page';

// Pre-Live Product Experience Completion Audit (finding #4): the homepage testimonials are
// original marketing copy attributed to "Early user", not verified real-user quotes. Presenting
// them as testimonials before any real, verified quotes exist is a trust risk for a product about
// to launch for the first time. This test proves the section stays off the live homepage even if
// a future edit accidentally re-adds the import.
describe('LandingPage — testimonials trust regression', () => {
  it('does not render the testimonials section publicly', () => {
    render(<LandingPage />);
    expect(screen.queryByRole('heading', { name: 'What people notice' })).not.toBeInTheDocument();
    expect(screen.queryByText('Early user')).not.toBeInTheDocument();
  });
});
